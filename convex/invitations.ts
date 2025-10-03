import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// List invitations
export const listInvitations = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const invitations = await ctx.db
      .query("invitations")
      .order("desc")
      .collect();

    // Add user details
    const invitationsWithUsers = await Promise.all(
      invitations.map(async (invitation) => {
        let invitedByUser = null;
        let usedByUser = null;

        if (invitation.invitedBy) {
          invitedByUser = await ctx.db.get(invitation.invitedBy);
        }

        if (invitation.usedBy) {
          usedByUser = await ctx.db.get(invitation.usedBy);
        }

        return {
          ...invitation,
          invitedByUser,
          usedByUser,
        };
      })
    );

    return invitationsWithUsers;
  },
});

// Create invitation
export const createInvitation = mutation({
  args: {
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Check if invitation already exists for this email
    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .first();

    if (existingInvitation) {
      throw new Error("Er bestaat al een actieve uitnodiging voor dit e-mailadres");
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    const invitationId = await ctx.db.insert("invitations", {
      email: args.email,
      role: args.role,
      token,
      expiresAt,
      isUsed: false,
      used: false,
      invitedBy: currentUser._id,
      permissions: {},
      createdBy: currentUser._id,
      createdAt: Date.now(),
    });

    // Log the invitation creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_INVITATION",
      target: `invitation:${invitationId}`,
      details: `Created invitation for: ${args.email}`,
    });

    return invitationId;
  },
});

// Check email invitation
export const checkEmailInvitation = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .first();

    if (!invitation) {
      return { isInvited: false, isUsed: false };
    }

    // Check if expired
    if (invitation.expiresAt < Date.now()) {
      return { isInvited: false, isUsed: false, expired: true };
    }

    return { isInvited: true, isUsed: false };
  },
});

// Use invitation
export const useInvitation = mutation({
  args: {
    email: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("isUsed"), false))
      .first();

    if (!invitation) {
      throw new Error("Geen geldige uitnodiging gevonden voor dit e-mailadres");
    }

    if (invitation.expiresAt < Date.now()) {
      throw new Error("Deze uitnodiging is verlopen");
    }

    await ctx.db.patch(invitation._id, {
      isUsed: true,
      used: true,
      usedBy: args.userId,
    });

    return invitation._id;
  },
});

// Delete invitation
export const deleteInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await ctx.db.delete(args.invitationId);

    // Log the invitation deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_INVITATION",
      target: `invitation:${args.invitationId}`,
      details: `Deleted invitation for: ${invitation.email}`,
    });

    return args.invitationId;
  },
});

// Resend invitation
export const resendInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Update expiration date
    const newExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    await ctx.db.patch(args.invitationId, {
      expiresAt: newExpiresAt,
    });

    // Log the invitation resend
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "RESEND_INVITATION",
      target: `invitation:${args.invitationId}`,
      details: `Resent invitation for: ${invitation.email}`,
    });

    return args.invitationId;
  },
});
