import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Get current user
export async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
}

// Get current user query
export const getCurrentUserQuery = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    return user;
  },
});

// List all users
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const users = await ctx.db.query("users").collect();
    return users;
  },
});

// Get user by ID
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await ctx.db.patch(currentUser._id, {
      name: args.name,
      email: args.email,
    });

    // Log the profile update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_PROFILE",
      target: `user:${currentUser._id}`,
      details: "Updated user profile",
    });

    return currentUser._id;
  },
});

// Get user statistics
export const getUserStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const targetUserId = args.userId || currentUser._id;

    // Get user's documents
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_created_by", (q) => q.eq("createdBy", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get user's time entries
    const timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get user's expenses
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_created_by", (q) => q.eq("createdBy", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const totalTimeHours = timeEntries
      .filter(entry => entry.duration)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0) / (1000 * 60 * 60);

    const totalExpenseAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      documentsCount: documents.length,
      timeEntriesCount: timeEntries.length,
      totalTimeHours: Math.round(totalTimeHours * 100) / 100,
      expensesCount: expenses.length,
      totalExpenseAmount,
    };
  },
});
