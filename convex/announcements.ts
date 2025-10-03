import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Create announcement
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    expiresAt: v.optional(v.number()),
    targetRoles: v.optional(v.array(v.string())),
    targetUsers: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const announcementId = await ctx.db.insert("announcements", {
      title: args.title,
      content: args.content,
      priority: args.priority,
      targetRoles: args.targetRoles,
      targetUsers: args.targetUsers,
      expiresAt: args.expiresAt,
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the announcement creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_ANNOUNCEMENT",
      target: `announcement:${announcementId}`,
      details: `Created announcement: ${args.title}`,
    });

    return announcementId;
  },
});

// List announcements
export const listAnnouncements = query({
  args: {
    includeExpired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let announcements = await ctx.db
      .query("announcements")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    // Filter out expired announcements unless requested
    if (!args.includeExpired) {
      const now = Date.now();
      announcements = announcements.filter(announcement => 
        !announcement.expiresAt || announcement.expiresAt > now
      );
    }

    // Filter based on targeting
    const filteredAnnouncements = announcements.filter(announcement => {
      // If no targeting specified, show to everyone
      if (!announcement.targetRoles && !announcement.targetUsers) {
        return true;
      }

      // Check if user is specifically targeted
      if (announcement.targetUsers?.includes(currentUser._id)) {
        return true;
      }

      // Check role-based targeting
      if (announcement.targetRoles?.includes("user")) {
        return true;
      }

      return false;
    });

    return filteredAnnouncements;
  },
});

// Get announcement by ID
export const getAnnouncement = query({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement || !announcement.isActive) {
      return null;
    }

    return announcement;
  },
});

// Update announcement
export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    )),
    expiresAt: v.optional(v.number()),
    targetRoles: v.optional(v.array(v.string())),
    targetUsers: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }

    await ctx.db.patch(args.announcementId, {
      title: args.title,
      content: args.content,
      priority: args.priority,
      expiresAt: args.expiresAt,
      targetRoles: args.targetRoles,
      targetUsers: args.targetUsers,
      updatedAt: Date.now(),
    });

    // Log the announcement update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_ANNOUNCEMENT",
      target: `announcement:${args.announcementId}`,
      details: `Updated announcement: ${announcement.title}`,
    });

    return args.announcementId;
  },
});

// Delete announcement
export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }

    await ctx.db.patch(args.announcementId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the announcement deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_ANNOUNCEMENT",
      target: `announcement:${args.announcementId}`,
      details: `Deleted announcement: ${announcement.title}`,
    });

    return args.announcementId;
  },
});

// Get announcements for current user
export const getMyAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const now = Date.now();
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        q.or(
          q.eq(q.field("expiresAt"), undefined),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .order("desc")
      .collect();

    // Filter based on targeting
    const myAnnouncements = announcements.filter(announcement => {
      // If no targeting specified, show to everyone
      if (!announcement.targetRoles && !announcement.targetUsers) {
        return true;
      }

      // Check if user is specifically targeted
      if (announcement.targetUsers?.includes(currentUser._id)) {
        return true;
      }

      // Check role-based targeting
      if (announcement.targetRoles?.includes("user")) {
        return true;
      }

      return false;
    });

    return myAnnouncements;
  },
});
