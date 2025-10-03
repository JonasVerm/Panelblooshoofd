import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get activities for a date range
export const getActivities = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    groupId: v.optional(v.id("memberGroups")),
    memberId: v.optional(v.id("members")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activities = args.startDate && args.endDate 
      ? await ctx.db.query("activities")
          .withIndex("by_date", (q) => 
            q.gte("datum", args.startDate!).lte("datum", args.endDate!)
          )
          .collect()
      : await ctx.db.query("activities").collect();

    return activities.filter(activity => {
      if (args.isActive !== undefined && activity.isActive !== args.isActive) {
        return false;
      }
      if (args.groupId && (!activity.targetGroupIds || !activity.targetGroupIds.includes(args.groupId))) {
        return false;
      }
      if (args.memberId && (!activity.targetMemberIds || !activity.targetMemberIds.includes(args.memberId))) {
        return false;
      }
      return true;
    });
  },
});

// Get activity by ID with attendance
export const getActivityWithAttendance = query({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activity = await ctx.db.get(args.id);
    if (!activity) return null;

    // Get attendance records
    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_activity", (q) => q.eq("activityId", args.id))
      .collect();

    // Get target members
    const targetMembers: any[] = [];
    
    // Add members from target groups
    if (activity.targetGroupIds) {
      for (const groupId of activity.targetGroupIds) {
        const group = await ctx.db.get(groupId);
        if (group && group.memberIds) {
          for (const memberId of group.memberIds) {
            const member = await ctx.db.get(memberId);
            if (member && member.isActive && !targetMembers.find(m => m._id === memberId)) {
              targetMembers.push(member);
            }
          }
        }
      }
    }

    // Add individual target members
    if (activity.targetMemberIds) {
      for (const memberId of activity.targetMemberIds) {
        const member = await ctx.db.get(memberId);
        if (member && member.isActive && !targetMembers.find(m => m._id === memberId)) {
          targetMembers.push(member);
        }
      }
    }

    // Combine members with their attendance status
    const membersWithAttendance = targetMembers.map(member => {
      const attendance = attendanceRecords.find(a => a.memberId === member._id);
      return {
        ...member,
        attendance: attendance || null,
      };
    });

    return {
      ...activity,
      members: membersWithAttendance,
      attendance: attendanceRecords,
      attendanceCount: {
        aanwezig: attendanceRecords.filter(a => a.status === "aanwezig").length,
        afwezig: attendanceRecords.filter(a => a.status === "afwezig").length,
        total: targetMembers.length,
      },
    };
  },
});

// Create activity
export const createActivity = mutation({
  args: {
    naam: v.string(),
    beschrijving: v.optional(v.string()),
    datum: v.number(),
    startTijd: v.string(),
    eindTijd: v.string(),
    locatie: v.optional(v.string()),
    kleur: v.optional(v.string()),
    type: v.union(v.literal("eenmalig"), v.literal("herhalend")),
    herhalingType: v.optional(v.union(
      v.literal("wekelijks"),
      v.literal("tweewekelijks"),
      v.literal("maandelijks")
    )),
    herhalingEinde: v.optional(v.number()),
    targetGroupIds: v.optional(v.array(v.id("memberGroups"))),
    targetMemberIds: v.optional(v.array(v.id("members"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activityId = await ctx.db.insert("activities", {
      ...args,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // If it's a recurring activity, create instances
    if (args.type === "herhalend" && args.herhalingType && args.herhalingEinde) {
      await createRecurringInstances(ctx, activityId, args, userId);
    }

    return activityId;
  },
});

// Helper function to create recurring activity instances
async function createRecurringInstances(ctx: any, parentId: any, args: any, userId: any) {
  const startDate = new Date(args.datum);
  const endDate = new Date(args.herhalingEinde);
  
  let currentDate = new Date(startDate);
  const instances = [];

  while (currentDate <= endDate) {
    // Skip the first instance (already created as parent)
    if (currentDate.getTime() !== startDate.getTime()) {
      const instanceId = await ctx.db.insert("activities", {
        naam: args.naam,
        beschrijving: args.beschrijving,
        datum: currentDate.getTime(),
        startTijd: args.startTijd,
        eindTijd: args.eindTijd,
        locatie: args.locatie,
        kleur: args.kleur,
        type: "eenmalig", // Instances are single events
        targetGroupIds: args.targetGroupIds,
        targetMemberIds: args.targetMemberIds,
        isActive: true,
        createdBy: userId,
        parentActivityId: parentId,
      });
      instances.push(instanceId);
    }

    // Calculate next occurrence
    switch (args.herhalingType) {
      case "wekelijks":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "tweewekelijks":
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case "maandelijks":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return instances;
}

// Update activity
export const updateActivity = mutation({
  args: {
    id: v.id("activities"),
    naam: v.optional(v.string()),
    beschrijving: v.optional(v.string()),
    datum: v.optional(v.number()),
    startTijd: v.optional(v.string()),
    eindTijd: v.optional(v.string()),
    locatie: v.optional(v.string()),
    kleur: v.optional(v.string()),
    targetGroupIds: v.optional(v.array(v.id("memberGroups"))),
    targetMemberIds: v.optional(v.array(v.id("members"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Update recurring activity (all future instances)
export const updateRecurringActivity = mutation({
  args: {
    id: v.id("activities"),
    naam: v.optional(v.string()),
    beschrijving: v.optional(v.string()),
    startTijd: v.optional(v.string()),
    eindTijd: v.optional(v.string()),
    locatie: v.optional(v.string()),
    kleur: v.optional(v.string()),
    targetGroupIds: v.optional(v.array(v.id("memberGroups"))),
    targetMemberIds: v.optional(v.array(v.id("members"))),
    updateAllFuture: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activity = await ctx.db.get(args.id);
    if (!activity) throw new Error("Activity not found");

    const { id, updateAllFuture, ...updates } = args;

    // Update the current activity
    await ctx.db.patch(id, updates);

    if (updateAllFuture) {
      // Find all future instances to update
      let instancesToUpdate: any[] = [];

      if (activity.type === "herhalend") {
        // If this is the parent recurring activity, update all instances
        instancesToUpdate = await ctx.db
          .query("activities")
          .withIndex("by_parent", (q) => q.eq("parentActivityId", args.id))
          .collect();
      } else if (activity.parentActivityId) {
        // If this is an instance, update all future instances including the parent
        const parentActivity = await ctx.db.get(activity.parentActivityId);
        if (parentActivity) {
          // Update parent if it's in the future
          if (parentActivity.datum >= activity.datum) {
            await ctx.db.patch(activity.parentActivityId, updates);
          }
          
          // Get all sibling instances
          const allInstances = await ctx.db
            .query("activities")
            .withIndex("by_parent", (q) => q.eq("parentActivityId", activity.parentActivityId))
            .collect();
          
          // Filter to only future instances (including current date)
          instancesToUpdate = allInstances.filter(instance => 
            instance.datum >= activity.datum && instance._id !== args.id
          );
        }
      }

      // Update all future instances
      for (const instance of instancesToUpdate) {
        await ctx.db.patch(instance._id, updates);
      }
    }

    return id;
  },
});

// Delete activity
export const deleteActivity = mutation({
  args: { 
    id: v.id("activities"),
    deleteRecurring: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activity = await ctx.db.get(args.id);
    if (!activity) throw new Error("Activity not found");

    // Delete attendance records
    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_activity", (q) => q.eq("activityId", args.id))
      .collect();

    for (const record of attendanceRecords) {
      await ctx.db.delete(record._id);
    }

    // If deleting recurring and this is a parent, delete all instances
    if (args.deleteRecurring && activity.type === "herhalend") {
      const instances = await ctx.db
        .query("activities")
        .withIndex("by_parent", (q) => q.eq("parentActivityId", args.id))
        .collect();

      for (const instance of instances) {
        // Delete attendance for each instance
        const instanceAttendance = await ctx.db
          .query("attendance")
          .withIndex("by_activity", (q) => q.eq("activityId", instance._id))
          .collect();

        for (const record of instanceAttendance) {
          await ctx.db.delete(record._id);
        }

        await ctx.db.delete(instance._id);
      }
    }

    // If deleting recurring and this is an instance, optionally delete all future instances
    if (args.deleteRecurring && activity.parentActivityId) {
      const parentActivity = await ctx.db.get(activity.parentActivityId);
      if (parentActivity) {
        // Delete parent if it's in the future
        if (parentActivity.datum >= activity.datum) {
          const parentAttendance = await ctx.db
            .query("attendance")
            .withIndex("by_activity", (q) => q.eq("activityId", activity.parentActivityId!))
            .collect();
          
          for (const record of parentAttendance) {
            await ctx.db.delete(record._id);
          }
          
          await ctx.db.delete(activity.parentActivityId);
        }
        
        // Get all sibling instances
        const allInstances = await ctx.db
          .query("activities")
          .withIndex("by_parent", (q) => q.eq("parentActivityId", activity.parentActivityId))
          .collect();
        
        // Delete all future instances (including current date)
        const futureInstances = allInstances.filter(instance => 
          instance.datum >= activity.datum
        );
        
        for (const instance of futureInstances) {
          const instanceAttendance = await ctx.db
            .query("attendance")
            .withIndex("by_activity", (q) => q.eq("activityId", instance._id))
            .collect();

          for (const record of instanceAttendance) {
            await ctx.db.delete(record._id);
          }

          await ctx.db.delete(instance._id);
        }
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Migration function to fix existing recurring activities
export const fixRecurringActivities = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recurringActivities = await ctx.db
      .query("activities")
      .filter((q) => q.eq(q.field("type"), "herhalend"))
      .collect();

    let fixedCount = 0;
    for (const activity of recurringActivities) {
      if (!activity.herhalingType || !activity.herhalingEinde) continue;
      const existingInstances = await ctx.db
        .query("activities")
        .withIndex("by_parent", (q) => q.eq("parentActivityId", activity._id))
        .collect();
      if (existingInstances.length === 0) {
        await createRecurringInstances(ctx, activity._id, activity, activity.createdBy);
        fixedCount++;
      }
    }
    return { message: `Fixed ${fixedCount} recurring activities` };
  },
});
