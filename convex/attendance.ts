import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Mark attendance
export const markAttendance = mutation({
  args: {
    activityId: v.id("activities"),
    memberId: v.id("members"),
    status: v.union(v.literal("aanwezig"), v.literal("afwezig")),
    notitie: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if attendance already exists
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_activity_member", (q) => 
        q.eq("activityId", args.activityId).eq("memberId", args.memberId)
      )
      .unique();

    if (existingAttendance) {
      // Update existing attendance
      await ctx.db.patch(existingAttendance._id, {
        status: args.status,
        notitie: args.notitie,
        markedBy: userId,
        markedAt: Date.now(),
      });
      return existingAttendance._id;
    } else {
      // Create new attendance record
      return await ctx.db.insert("attendance", {
        activityId: args.activityId,
        memberId: args.memberId,
        status: args.status,
        notitie: args.notitie,
        markedBy: userId,
        markedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Get attendance for activity
export const getAttendanceForActivity = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .collect();

    // Get member details for each attendance record
    const attendanceWithMembers = [];
    for (const record of attendanceRecords) {
      const member = await ctx.db.get(record.memberId);
      if (member) {
        attendanceWithMembers.push({
          ...record,
          member,
        });
      }
    }

    return attendanceWithMembers;
  },
});

// Get attendance for member
export const getAttendanceForMember = query({
  args: { 
    memberId: v.id("members"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
      .collect();

    // Get activity details and filter by date if provided
    const attendanceWithActivities = [];
    for (const record of attendanceRecords) {
      const activity = await ctx.db.get(record.activityId);
      if (activity) {
        // Filter by date range if provided
        if (args.startDate && activity.datum < args.startDate) continue;
        if (args.endDate && activity.datum > args.endDate) continue;

        attendanceWithActivities.push({
          ...record,
          activity,
        });
      }
    }

    return attendanceWithActivities.sort((a, b) => b.activity.datum - a.activity.datum);
  },
});

// Bulk mark attendance
export const bulkMarkAttendance = mutation({
  args: {
    activityId: v.id("activities"),
    attendanceData: v.array(v.object({
      memberId: v.id("members"),
      status: v.union(v.literal("aanwezig"), v.literal("afwezig")),
      notitie: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const results = [];

    for (const data of args.attendanceData) {
      // Check if attendance already exists
      const existingAttendance = await ctx.db
        .query("attendance")
        .withIndex("by_activity_member", (q) => 
          q.eq("activityId", args.activityId).eq("memberId", data.memberId)
        )
        .unique();

      if (existingAttendance) {
        // Update existing attendance
        await ctx.db.patch(existingAttendance._id, {
          status: data.status,
          notitie: data.notitie,
          markedBy: userId,
          markedAt: Date.now(),
        });
        results.push(existingAttendance._id);
      } else {
        // Create new attendance record
        const attendanceId = await ctx.db.insert("attendance", {
          activityId: args.activityId,
          memberId: data.memberId,
          status: data.status,
          notitie: data.notitie,
          markedBy: userId,
          markedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push(attendanceId);
      }
    }

    return results;
  },
});

// Get attendance statistics
export const getAttendanceStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    groupId: v.optional(v.id("memberGroups")),
    memberId: v.optional(v.id("members")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get activities in date range
    const activities = args.startDate && args.endDate 
      ? await ctx.db.query("activities")
          .withIndex("by_date", (q) => 
            q.gte("datum", args.startDate!).lte("datum", args.endDate!)
          )
          .collect()
      : await ctx.db.query("activities").collect();
    const filteredActivities = activities.filter(activity => {
      if (args.groupId && (!activity.targetGroupIds || !activity.targetGroupIds.includes(args.groupId))) {
        return false;
      }
      if (args.memberId && (!activity.targetMemberIds || !activity.targetMemberIds.includes(args.memberId))) {
        return false;
      }
      return activity.isActive;
    });

    // Get attendance for these activities
    const stats = {
      totalActivities: filteredActivities.length,
      totalAttendanceRecords: 0,
      aanwezig: 0,
      afwezig: 0,
      attendanceRate: 0,
    };

    for (const activity of filteredActivities) {
      const attendanceRecords = await ctx.db
        .query("attendance")
        .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
        .collect();

      stats.totalAttendanceRecords += attendanceRecords.length;
      stats.aanwezig += attendanceRecords.filter(r => r.status === "aanwezig").length;
      stats.afwezig += attendanceRecords.filter(r => r.status === "afwezig").length;
    }

    if (stats.totalAttendanceRecords > 0) {
      stats.attendanceRate = Math.round((stats.aanwezig / stats.totalAttendanceRecords) * 100);
    }

    return stats;
  },
});
