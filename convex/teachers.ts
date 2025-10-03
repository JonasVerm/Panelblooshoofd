import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTeachers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("teachers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const listTeachers = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.includeInactive) {
      return await ctx.db.query("teachers").collect();
    } else {
      return await ctx.db
        .query("teachers")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }
  },
});

export const getTeacher = query({
  args: {
    teacherId: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.get(args.teacherId);
  },
});

export const getAllTeachers = query({
  args: {},
  handler: async (ctx) => {
    // This is a public query for calendar access, no auth required
    return await ctx.db.query("teachers").collect();
  },
});

export const getTeacherByCalendarToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // This is a public query for calendar access, no auth required
    return await ctx.db
      .query("teachers")
      .withIndex("by_calendar_token", (q) => q.eq("calendarToken", args.token))
      .unique();
  },
});

export const getCurrentTeacher = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const searchTeachers = query({
  args: {
    searchTerm: v.string(),
    includeInactive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const results = await ctx.db
      .query("teachers")
      .withSearchIndex("search_teachers", (q) => 
        q.search("name", args.searchTerm)
      )
      .collect();
    
    if (args.includeInactive) {
      return results;
    } else {
      return results.filter(teacher => teacher.isActive);
    }
  },
});

export const getTeachersWithStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const teachers = await ctx.db.query("teachers").collect();
    const workshops = await ctx.db.query("workshops").collect();
    
    return teachers.map(teacher => {
      const teacherWorkshops = workshops.filter(w => w.teacherId === teacher._id);
      const now = Date.now();
      
      return {
        ...teacher,
        stats: {
          total: teacherWorkshops.length,
          upcoming: teacherWorkshops.filter(w => w.datum && w.datum > now).length,
          completed: teacherWorkshops.filter(w => w.datum && w.datum <= now).length,
        }
      };
    });
  },
});

export const getTeacherWorkshops = query({
  args: {
    teacherId: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("workshops")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();
  },
});

export const ensureCalendarTokens = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const teachers = await ctx.db.query("teachers").collect();
    
    for (const teacher of teachers) {
      if (!teacher.calendarToken) {
        const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await ctx.db.patch(teacher._id, {
          calendarToken: newToken,
        });
      }
    }
  },
});

export const createTeacher = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Generate a unique calendar token
    const calendarToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    return await ctx.db.insert("teachers", {
      ...args,
      isActive: true,
      calendarToken,
      createdBy: userId,
      specialties: [],
      availability: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateTeacher = mutation({
  args: {
    id: v.id("teachers"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { id, ...updateData } = args;
    return await ctx.db.patch(id, updateData);
  },
});

export const deleteTeacher = mutation({
  args: {
    id: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.delete(args.id);
  },
});

export const regenerateCalendarToken = mutation({
  args: {
    id: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    await ctx.db.patch(args.id, {
      calendarToken: newToken,
    });

    return newToken;
  },
});
