import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Create time entry
export const createTimeEntry = mutation({
  args: {
    description: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    project: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const duration = args.endTime ? args.endTime - args.startTime : undefined;
    const date = new Date(args.startTime).toISOString().split('T')[0];

    const timeEntryId = await ctx.db.insert("timeEntries", {
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
      project: args.project,
      category: args.category,
      userId: currentUser._id,
      date,
      isRunning: !args.endTime,
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the time entry creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_TIME_ENTRY",
      target: `timeEntry:${timeEntryId}`,
      details: `Created time entry: ${args.description}`,
    });

    return timeEntryId;
  },
});

// List time entries
export const listTimeEntries = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    project: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Filter by user
    const targetUserId = args.userId || currentUser._id;
    
    let timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(args.limit || 50);

    // Filter by date range
    if (args.startDate || args.endDate) {
      timeEntries = timeEntries.filter(entry => {
        if (args.startDate && entry.date && entry.date < args.startDate) return false;
        if (args.endDate && entry.date && entry.date > args.endDate) return false;
        return true;
      });
    }

    // Filter by project
    if (args.project) {
      timeEntries = timeEntries.filter(entry => entry.project === args.project);
    }

    return timeEntries;
  },
});

// Get time entry statistics
export const getTimeStats = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const targetUserId = args.userId || currentUser._id;
    
    let timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by date range
    if (args.startDate || args.endDate) {
      timeEntries = timeEntries.filter(entry => {
        if (args.startDate && entry.date && entry.date < args.startDate) return false;
        if (args.endDate && entry.date && entry.date > args.endDate) return false;
        return true;
      });
    }

    const totalDuration = timeEntries
      .filter(entry => entry.duration)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

    const totalHours = Math.round((totalDuration / (1000 * 60 * 60)) * 100) / 100;

    // Group by project
    const byProject = timeEntries.reduce((acc, entry) => {
      const project = entry.project || "No Project";
      if (!acc[project]) {
        acc[project] = { duration: 0, count: 0 };
      }
      acc[project].duration += entry.duration || 0;
      acc[project].count += 1;
      return acc;
    }, {} as Record<string, { duration: number; count: number }>);

    return {
      totalHours,
      totalEntries: timeEntries.length,
      byProject,
    };
  },
});

// Update time entry
export const updateTimeEntry = mutation({
  args: {
    timeEntryId: v.id("timeEntries"),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    project: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const timeEntry = await ctx.db.get(args.timeEntryId);
    if (!timeEntry) {
      throw new Error("Time entry not found");
    }

    const startTime = args.startTime || timeEntry.startTime;
    const endTime = args.endTime || timeEntry.endTime;
    const duration = endTime ? endTime - startTime : undefined;

    await ctx.db.patch(args.timeEntryId, {
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
      project: args.project,
      category: args.category,
      isRunning: !endTime,
      updatedAt: Date.now(),
    });

    // Log the time entry update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_TIME_ENTRY",
      target: `timeEntry:${args.timeEntryId}`,
      details: `Updated time entry: ${timeEntry.description}`,
    });

    return args.timeEntryId;
  },
});

// Delete time entry
export const deleteTimeEntry = mutation({
  args: { timeEntryId: v.id("timeEntries") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const timeEntry = await ctx.db.get(args.timeEntryId);
    if (!timeEntry) {
      throw new Error("Time entry not found");
    }

    await ctx.db.patch(args.timeEntryId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the time entry deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_TIME_ENTRY",
      target: `timeEntry:${args.timeEntryId}`,
      details: `Deleted time entry: ${timeEntry.description}`,
    });

    return args.timeEntryId;
  },
});

// Stop running time entry
export const stopTimeEntry = mutation({
  args: { timeEntryId: v.id("timeEntries") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const timeEntry = await ctx.db.get(args.timeEntryId);
    if (!timeEntry) {
      throw new Error("Time entry not found");
    }

    const endTime = Date.now();
    const duration = endTime - timeEntry.startTime;

    await ctx.db.patch(args.timeEntryId, {
      endTime,
      duration,
      isRunning: false,
      updatedAt: Date.now(),
    });

    return args.timeEntryId;
  },
});
