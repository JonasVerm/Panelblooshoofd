import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { api } from "./_generated/api";

// Admin only: Get audit logs
export const getAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    // Check if current user is admin based on email
    const isAdmin = currentUser.email === "admin@example.com" || currentUser.email === "jonas@blooshoofd.be";
    
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(args.limit || 50);

    // Enrich with actor usernames
    const enrichedLogs = [];
    for (const log of logs) {
      const actor = await ctx.db.get(log.actor);
      enrichedLogs.push({
        ...log,
        actorUsername: actor?.name || actor?.email || "Unknown",
      });
    }

    return enrichedLogs;
  },
});

// Internal function to log actions
export const log = internalMutation({
  args: {
    actor: v.id("users"),
    action: v.string(),
    target: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      userId: args.actor,
      actor: args.actor,
      action: args.action,
      resource: "general",
      target: args.target,
      details: args.details,
      timestamp: Date.now(),
    });
  },
});

// Get audit statistics
export const getAuditStats = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("auditLogs").collect();
    return {
      totalActions: logs.length,
    };
  },
});

// Get recent audit logs (alias for getAuditLogs)
export const getRecentAuditLogs = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    // Check if current user is admin based on email
    const isAdmin = currentUser.email === "admin@example.com" || currentUser.email === "jonas@blooshoofd.be";
    
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(args.limit || 50);

    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const actor = await ctx.db.get(log.actor);
        return {
          ...log,
          actorUsername: actor?.name || actor?.email || "Unknown",
        };
      })
    );

    return logsWithUsers;
  },
});
