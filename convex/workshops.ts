import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Create workshop
export const createWorkshop = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    location: v.string(),
    maxParticipants: v.number(),
    price: v.number(),
    category: v.string(),
    teacherId: v.optional(v.id("teachers")),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const workshopId = await ctx.db.insert("workshops", {
      title: args.title,
      description: args.description,
      date: args.date,
      datum: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      startUur: args.startTime,
      eindUur: args.endTime,
      location: args.location,
      maxParticipants: args.maxParticipants,
      price: args.price,
      category: args.category,
      teacherId: args.teacherId,
      imageUrl: args.imageUrl,
      factuurStatus: "niet_verzonden",
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the workshop creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_WORKSHOP",
      target: `workshop:${workshopId}`,
      details: `Created workshop: ${args.title}`,
    });

    return workshopId;
  },
});

// List workshops
export const listWorkshops = query({
  args: {
    category: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let workshops;

    if (args.category) {
      workshops = await ctx.db
        .query("workshops")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(args.limit || 50);
    } else {
      workshops = await ctx.db
        .query("workshops")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(args.limit || 50);
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      workshops = workshops.filter(workshop => {
        if (args.startDate && workshop.date && workshop.date < args.startDate) return false;
        if (args.endDate && workshop.date && workshop.date > args.endDate) return false;
        return true;
      });
    }

    return workshops;
  },
});

// Get workshop by ID
export const getWorkshop = query({
  args: { workshopId: v.id("workshops") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const workshop = await ctx.db.get(args.workshopId);
    if (!workshop || !workshop.isActive) {
      return null;
    }

    return workshop;
  },
});

// Update workshop
export const updateWorkshop = mutation({
  args: {
    workshopId: v.id("workshops"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    location: v.optional(v.string()),
    maxParticipants: v.optional(v.number()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    teacherId: v.optional(v.id("teachers")),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const workshop = await ctx.db.get(args.workshopId);
    if (!workshop) {
      throw new Error("Workshop not found");
    }

    await ctx.db.patch(args.workshopId, {
      title: args.title,
      description: args.description,
      date: args.date,
      datum: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      startUur: args.startTime,
      eindUur: args.endTime,
      location: args.location,
      maxParticipants: args.maxParticipants,
      price: args.price,
      category: args.category,
      teacherId: args.teacherId,
      imageUrl: args.imageUrl,
      updatedAt: Date.now(),
    });

    // Log the workshop update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_WORKSHOP",
      target: `workshop:${args.workshopId}`,
      details: `Updated workshop: ${workshop.title}`,
    });

    return args.workshopId;
  },
});

// Delete workshop
export const deleteWorkshop = mutation({
  args: { workshopId: v.id("workshops") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const workshop = await ctx.db.get(args.workshopId);
    if (!workshop) {
      throw new Error("Workshop not found");
    }

    await ctx.db.patch(args.workshopId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the workshop deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_WORKSHOP",
      target: `workshop:${args.workshopId}`,
      details: `Deleted workshop: ${workshop.title}`,
    });

    return args.workshopId;
  },
});

// Get workshop categories
export const getWorkshopCategories = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const workshops = await ctx.db
      .query("workshops")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = [...new Set(workshops.map(w => w.category).filter(Boolean))];
    return categories.sort();
  },
});

// Get workshops by teacher
export const getWorkshopsByTeacher = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    const workshops = await ctx.db
      .query("workshops")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return workshops;
  },
});
