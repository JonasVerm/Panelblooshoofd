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
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const duration = args.endTime ? args.endTime - args.startTime : undefined;
    const date = new Date(args.startTime).toISOString().split('T')[0];
    const targetUserId = args.userId || currentUser._id;

    const timeEntryId = await ctx.db.insert("timeEntries", {
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
      project: args.project,
      category: args.category,
      userId: targetUserId,
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

    // Filter by user - if no userId provided, use current user
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

// Create manual time entry with hours
export const createManualTimeEntry = mutation({
  args: {
    description: v.string(),
    hours: v.number(),
    date: v.string(),
    project: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const duration = args.hours * 60 * 60 * 1000;
    const dateObj = new Date(args.date + 'T12:00:00.000Z');
    const timestamp = dateObj.getTime();
    const targetUserId = args.userId || currentUser._id;

    return await ctx.db.insert("timeEntries", {
      description: args.description,
      startTime: timestamp,
      endTime: timestamp + duration,
      duration,
      project: args.project,
      userId: targetUserId,
      date: args.date,
      isRunning: false,
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getMonthlyEntries = query({
  args: { 
    year: v.number(), 
    month: v.number(),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const targetUserId = args.userId || currentUser._id;
    
    const start = `${args.year}-${String(args.month).padStart(2, '0')}-01`;
    const next = args.month === 12 ? 1 : args.month + 1;
    const nextYear = args.month === 12 ? args.year + 1 : args.year;
    const end = `${nextYear}-${String(next).padStart(2, '0')}-01`;
    
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const monthly = entries.filter(e => e.date && e.date >= start && e.date < end);
    const hours = monthly.reduce((sum, e) => sum + (e.duration || 0), 0) / (1000 * 60 * 60);

    return { entries: monthly, totalHours: Math.round(hours * 100) / 100 };
  },
});

// Projects management
export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();

    return projects;
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    return await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      color: args.color || "#3B82F6",
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      name: args.name,
      description: args.description,
      color: args.color,
      updatedAt: Date.now(),
    });

    return args.projectId;
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.db.patch(args.projectId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.projectId;
  },
});

// Get all users for time entry assignment
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    
    const users = await ctx.db
      .query("users")
      .collect();

    return users.map(user => ({
      _id: user._id,
      name: user.name || user.email || "Unknown User",
      email: user.email,
    }));
  },
});
