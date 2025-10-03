import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all members
export const getMembers = query({
  args: {
    search: v.optional(v.string()),
    groupId: v.optional(v.id("memberGroups")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const membersQuery = args.search 
      ? ctx.db
          .query("members")
          .withSearchIndex("search_members", (q) =>
            q.search("naam", args.search!)
          )
      : ctx.db.query("members");

    const members = await membersQuery.collect();

    return members.filter(member => {
      if (args.isActive !== undefined && member.isActive !== args.isActive) {
        return false;
      }
      if (args.groupId && (!member.groupIds || !member.groupIds.includes(args.groupId))) {
        return false;
      }
      return true;
    });
  },
});

// Get member by ID
export const getMember = query({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.get(args.id);
  },
});

// Create member
export const createMember = mutation({
  args: {
    naam: v.string(),
    voornaam: v.string(),
    gsmNummer: v.optional(v.string()),
    emailAdres: v.optional(v.string()),
    naamOuders: v.optional(v.string()),
    emailOuders: v.optional(v.string()),
    gsmOuders: v.optional(v.string()),
    adres: v.optional(v.string()),
    rijksregisternummer: v.optional(v.string()),
    opmerkingen: v.optional(v.string()),
    groupIds: v.optional(v.array(v.id("memberGroups"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const memberId = await ctx.db.insert("members", {
      ...args,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update group member lists if groups are specified
    if (args.groupIds) {
      for (const groupId of args.groupIds) {
        const group = await ctx.db.get(groupId);
        if (group) {
          const memberIds = group.memberIds || [];
          if (!memberIds.includes(memberId)) {
            await ctx.db.patch(groupId, {
              memberIds: [...memberIds, memberId],
            });
          }
        }
      }
    }

    return memberId;
  },
});

// Update member
export const updateMember = mutation({
  args: {
    id: v.id("members"),
    naam: v.optional(v.string()),
    voornaam: v.optional(v.string()),
    gsmNummer: v.optional(v.string()),
    emailAdres: v.optional(v.string()),
    naamOuders: v.optional(v.string()),
    emailOuders: v.optional(v.string()),
    gsmOuders: v.optional(v.string()),
    adres: v.optional(v.string()),
    rijksregisternummer: v.optional(v.string()),
    opmerkingen: v.optional(v.string()),
    groupIds: v.optional(v.array(v.id("memberGroups"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const member = await ctx.db.get(id);
    if (!member) throw new Error("Member not found");

    // Handle group updates
    if (updates.groupIds !== undefined) {
      const oldGroupIds = member.groupIds || [];
      const newGroupIds = updates.groupIds || [];

      // Remove member from old groups
      for (const groupId of oldGroupIds) {
        if (!newGroupIds.includes(groupId)) {
          const group = await ctx.db.get(groupId);
          if (group && group.memberIds) {
            await ctx.db.patch(groupId, {
              memberIds: group.memberIds.filter(mid => mid !== id),
            });
          }
        }
      }

      // Add member to new groups
      for (const groupId of newGroupIds) {
        if (!oldGroupIds.includes(groupId)) {
          const group = await ctx.db.get(groupId);
          if (group) {
            const memberIds = group.memberIds || [];
            if (!memberIds.includes(id)) {
              await ctx.db.patch(groupId, {
                memberIds: [...memberIds, id],
              });
            }
          }
        }
      }
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete member
export const deleteMember = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db.get(args.id);
    if (!member) throw new Error("Member not found");

    // Remove member from all groups
    if (member.groupIds) {
      for (const groupId of member.groupIds) {
        const group = await ctx.db.get(groupId);
        if (group && group.memberIds) {
          await ctx.db.patch(groupId, {
            memberIds: group.memberIds.filter(mid => mid !== args.id),
          });
        }
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
