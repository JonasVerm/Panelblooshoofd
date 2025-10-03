import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all groups
export const getGroups = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const groups = await ctx.db
      .query("memberGroups")
      .filter((q) => args.isActive === undefined || q.eq(q.field("isActive"), args.isActive))
      .collect();

    return groups;
  },
});

// Get group by ID with members
export const getGroupWithMembers = query({
  args: { id: v.id("memberGroups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.id);
    if (!group) return null;

    const members = [];
    if (group.memberIds) {
      for (const memberId of group.memberIds) {
        const member = await ctx.db.get(memberId);
        if (member) {
          members.push(member);
        }
      }
    }

    return {
      ...group,
      members,
    };
  },
});

// Create group
export const createGroup = mutation({
  args: {
    naam: v.string(),
    beschrijving: v.optional(v.string()),
    kleur: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("memberGroups", {
      ...args,
      isActive: true,
      createdBy: userId,
      memberIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update group
export const updateGroup = mutation({
  args: {
    id: v.id("memberGroups"),
    naam: v.optional(v.string()),
    beschrijving: v.optional(v.string()),
    kleur: v.optional(v.string()),
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

// Add member to group
export const addMemberToGroup = mutation({
  args: {
    groupId: v.id("memberGroups"),
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.groupId);
    const member = await ctx.db.get(args.memberId);
    
    if (!group || !member) throw new Error("Group or member not found");

    // Add member to group
    const memberIds = group.memberIds || [];
    if (!memberIds.includes(args.memberId)) {
      await ctx.db.patch(args.groupId, {
        memberIds: [...memberIds, args.memberId],
      });
    }

    // Add group to member
    const groupIds = member.groupIds || [];
    if (!groupIds.includes(args.groupId)) {
      await ctx.db.patch(args.memberId, {
        groupIds: [...groupIds, args.groupId],
      });
    }

    return true;
  },
});

// Remove member from group
export const removeMemberFromGroup = mutation({
  args: {
    groupId: v.id("memberGroups"),
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.groupId);
    const member = await ctx.db.get(args.memberId);
    
    if (!group || !member) throw new Error("Group or member not found");

    // Remove member from group
    if (group.memberIds) {
      await ctx.db.patch(args.groupId, {
        memberIds: group.memberIds.filter(id => id !== args.memberId),
      });
    }

    // Remove group from member
    if (member.groupIds) {
      await ctx.db.patch(args.memberId, {
        groupIds: member.groupIds.filter(id => id !== args.groupId),
      });
    }

    return true;
  },
});

// Delete group
export const deleteGroup = mutation({
  args: { id: v.id("memberGroups") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.id);
    if (!group) throw new Error("Group not found");

    // Remove group from all members
    if (group.memberIds) {
      for (const memberId of group.memberIds) {
        const member = await ctx.db.get(memberId);
        if (member && member.groupIds) {
          await ctx.db.patch(memberId, {
            groupIds: member.groupIds.filter(id => id !== args.id),
          });
        }
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
