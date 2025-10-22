import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getRooms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Helper function to get day of week from date string
function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Helper function to check if a time is within a range
function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export const getRoomAvailability = query({
  args: {
    roomId: v.id("rooms"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the day of the week for this date
    const dayOfWeek = getDayOfWeek(args.date);

    // Get room's standard availability for this day
    const roomAvailability = await ctx.db
      .query("roomAvailability")
      .withIndex("by_room_day", (q) => q.eq("roomId", args.roomId).eq("dayOfWeek", dayOfWeek as any))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get all reservations for this room on this date
    const reservations = await ctx.db
      .query("roomReservations")
      .withIndex("by_room_date", (q) => q.eq("roomId", args.roomId).eq("date", args.date))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get unavailability periods for this room on this date
    const unavailability = await ctx.db
      .query("roomUnavailability")
      .withIndex("by_room_date", (q) => q.eq("roomId", args.roomId).eq("date", args.date))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // If no standard availability is set, room is not available at all
    if (roomAvailability.length === 0) {
      return [{
        _id: "no-availability" as any,
        startTime: "00:00",
        endTime: "23:59",
        customerName: "Niet beschikbaar",
        purpose: "Ruimte niet beschikbaar op deze dag",
        type: "unavailable" as const,
      }];
    }

    // Combine reservations and unavailability, but filter by standard availability
    const allBookings = [
      ...reservations
        .filter(r => {
          // Only include reservations that fall within standard availability hours
          return roomAvailability.some(avail => 
            isTimeInRange(r.startTime, avail.startTime, avail.endTime)
          );
        })
        .map(r => ({
          _id: r._id,
          startTime: r.startTime,
          endTime: r.endTime,
          customerName: r.customerName,
          purpose: r.purpose,
          type: "reservation" as const,
        })),
      ...unavailability
        .filter(u => {
          // Only include unavailability that falls within standard availability hours
          return roomAvailability.some(avail => 
            isTimeInRange(u.startTime, avail.startTime, avail.endTime)
          );
        })
        .map(u => ({
          _id: u._id,
          startTime: u.startTime,
          endTime: u.endTime,
          customerName: "Niet beschikbaar",
          purpose: u.reason,
          type: "unavailable" as const,
        })),
    ];

    // Add unavailability for times outside standard availability
    const standardUnavailability = [];
    
    // Sort availability periods by start time
    const sortedAvailability = roomAvailability.sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    // Add unavailability before first availability period
    if (sortedAvailability.length > 0 && sortedAvailability[0].startTime !== "00:00") {
      standardUnavailability.push({
        _id: "before-hours" as any,
        startTime: "00:00",
        endTime: sortedAvailability[0].startTime,
        customerName: "Gesloten",
        purpose: "Buiten openingstijden",
        type: "unavailable" as const,
      });
    }

    // Add unavailability between availability periods
    for (let i = 0; i < sortedAvailability.length - 1; i++) {
      const current = sortedAvailability[i];
      const next = sortedAvailability[i + 1];
      
      if (current.endTime !== next.startTime) {
        standardUnavailability.push({
          _id: `gap-${i}` as any,
          startTime: current.endTime,
          endTime: next.startTime,
          customerName: "Gesloten",
          purpose: "Buiten openingstijden",
          type: "unavailable" as const,
        });
      }
    }

    // Add unavailability after last availability period
    const lastAvailability = sortedAvailability[sortedAvailability.length - 1];
    if (lastAvailability && lastAvailability.endTime !== "23:59") {
      standardUnavailability.push({
        _id: "after-hours" as any,
        startTime: lastAvailability.endTime,
        endTime: "23:59",
        customerName: "Gesloten",
        purpose: "Buiten openingstijden",
        type: "unavailable" as const,
      });
    }

    return [...allBookings, ...standardUnavailability];
  },
});

export const createReservation = mutation({
  args: {
    roomId: v.id("rooms"),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    purpose: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the day of the week for this date
    const dayOfWeek = getDayOfWeek(args.date);

    // Check if room is available during standard hours
    const roomAvailability = await ctx.db
      .query("roomAvailability")
      .withIndex("by_room_day", (q) => q.eq("roomId", args.roomId).eq("dayOfWeek", dayOfWeek as any))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Check if the requested time falls within standard availability
    const isWithinStandardHours = roomAvailability.some(avail => 
      isTimeInRange(args.startTime, avail.startTime, avail.endTime) &&
      isTimeInRange(args.endTime, avail.startTime, avail.endTime)
    );

    if (!isWithinStandardHours) {
      throw new Error("Reservering valt buiten de beschikbare tijden voor deze ruimte");
    }

    // Check if the time slot is available
    const existingReservations = await ctx.db
      .query("roomReservations")
      .withIndex("by_room_date", (q) => q.eq("roomId", args.roomId).eq("date", args.date))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const unavailability = await ctx.db
      .query("roomUnavailability")
      .withIndex("by_room_date", (q) => q.eq("roomId", args.roomId).eq("date", args.date))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Check for conflicts
    const startHour = parseInt(args.startTime.split(':')[0]);
    const endHour = parseInt(args.endTime.split(':')[0]);

    const hasConflict = [...existingReservations, ...unavailability].some(booking => {
      const bookingStart = parseInt(booking.startTime.split(':')[0]);
      const bookingEnd = parseInt(booking.endTime.split(':')[0]);
      
      return (
        (startHour >= bookingStart && startHour < bookingEnd) ||
        (endHour > bookingStart && endHour <= bookingEnd) ||
        (startHour <= bookingStart && endHour >= bookingEnd)
      );
    });

    if (hasConflict) {
      throw new Error("Dit tijdslot is niet beschikbaar");
    }

    // Create the reservation
    const reservationId = await ctx.db.insert("roomReservations", {
      roomId: args.roomId,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      purpose: args.purpose,
      notes: args.notes,
      status: "confirmed",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return reservationId;
  },
});

export const getReservations = query({
  args: {
    roomId: v.optional(v.id("rooms")),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let reservations;

    if (args.roomId && args.date) {
      reservations = await ctx.db
        .query("roomReservations")
        .withIndex("by_room_date", (q) => 
          q.eq("roomId", args.roomId!).eq("date", args.date!)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else if (args.roomId) {
      reservations = await ctx.db
        .query("roomReservations")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else if (args.date) {
      reservations = await ctx.db
        .query("roomReservations")
        .withIndex("by_date", (q) => q.eq("date", args.date!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      reservations = await ctx.db
        .query("roomReservations")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    // Get room details for each reservation
    const reservationsWithRooms = await Promise.all(
      reservations.map(async (reservation) => {
        const room = await ctx.db.get(reservation.roomId);
        return {
          ...reservation,
          room,
        };
      })
    );

    return reservationsWithRooms;
  },
});

export const updateReservationStatus = mutation({
  args: {
    reservationId: v.id("roomReservations"),
    status: v.union(v.literal("confirmed"), v.literal("pending"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Niet geautoriseerd");
    }

    await ctx.db.patch(args.reservationId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const deleteReservation = mutation({
  args: {
    reservationId: v.id("roomReservations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Niet geautoriseerd");
    }

    await ctx.db.patch(args.reservationId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Room management functions
export const createRoom = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    capacity: v.optional(v.number()),
    equipment: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Niet geautoriseerd");
    }

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      description: args.description,
      capacity: args.capacity,
      equipment: args.equipment,
      color: args.color,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return roomId;
  },
});

export const updateRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    capacity: v.optional(v.number()),
    equipment: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Niet geautoriseerd");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.capacity !== undefined) updates.capacity = args.capacity;
    if (args.equipment !== undefined) updates.equipment = args.equipment;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.roomId, updates);
  },
});

export const deleteRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Niet geautoriseerd");
    }

    await ctx.db.patch(args.roomId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Room availability management
export const getRoomAvailabilitySchedule = query({
  args: {
    roomId: v.optional(v.id("rooms")),
  },
  handler: async (ctx, args) => {
    if (args.roomId) {
      return await ctx.db
        .query("roomAvailability")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      return await ctx.db
        .query("roomAvailability")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
  },
});

export const setRoomAvailability = mutation({
  args: {
    roomId: v.id("rooms"),
    schedule: v.array(v.object({
      dayOfWeek: v.union(
        v.literal("monday"),
        v.literal("tuesday"), 
        v.literal("wednesday"),
        v.literal("thursday"),
        v.literal("friday"),
        v.literal("saturday"),
        v.literal("sunday")
      ),
      startTime: v.string(),
      endTime: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Niet geautoriseerd");
    }

    // Delete existing availability for this room
    const existingAvailability = await ctx.db
      .query("roomAvailability")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const availability of existingAvailability) {
      await ctx.db.patch(availability._id, { isActive: false });
    }

    // Create new availability entries
    for (const schedule of args.schedule) {
      await ctx.db.insert("roomAvailability", {
        roomId: args.roomId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: true,
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return "Beschikbaarheid bijgewerkt";
  },
});

// Room unavailability management
export const createUnavailability = mutation({
  args: {
    roomId: v.id("rooms"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Niet geautoriseerd");
    }

    const unavailabilityId = await ctx.db.insert("roomUnavailability", {
      roomId: args.roomId,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      reason: args.reason,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return unavailabilityId;
  },
});

export const getUnavailability = query({
  args: {
    roomId: v.optional(v.id("rooms")),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.roomId && args.date) {
      return await ctx.db
        .query("roomUnavailability")
        .withIndex("by_room_date", (q) => 
          q.eq("roomId", args.roomId!).eq("date", args.date!)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else if (args.roomId) {
      return await ctx.db
        .query("roomUnavailability")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else if (args.date) {
      return await ctx.db
        .query("roomUnavailability")
        .withIndex("by_date", (q) => q.eq("date", args.date!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      return await ctx.db
        .query("roomUnavailability")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
  },
});

export const deleteUnavailability = mutation({
  args: {
    unavailabilityId: v.id("roomUnavailability"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Niet geautoriseerd");
    }

    await ctx.db.patch(args.unavailabilityId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
