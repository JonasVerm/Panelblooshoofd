import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Create expense
export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.number(),
    receipt: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const expenseId = await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: args.category,
      date: args.date,
      receipt: args.receipt,
      notes: args.notes,
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the expense creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_EXPENSE",
      target: `expense:${expenseId}`,
      details: `Created expense: ${args.description} - €${args.amount}`,
    });

    return expenseId;
  },
});

// List expenses
export const listExpenses = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let expenses;

    if (args.category) {
      expenses = await ctx.db
        .query("expenses")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(args.limit || 50);
    } else {
      expenses = await ctx.db
        .query("expenses")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(args.limit || 50);
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      expenses = expenses.filter(expense => {
        if (args.startDate && expense.date < args.startDate) return false;
        if (args.endDate && expense.date > args.endDate) return false;
        return true;
      });
    }

    // Add receipt URLs
    const expensesWithUrls = await Promise.all(
      expenses.map(async (expense) => {
        let receiptUrl = null;
        if (expense.receipt) {
          receiptUrl = await ctx.storage.getUrl(expense.receipt);
        }
        return { ...expense, receiptUrl };
      })
    );

    return expensesWithUrls;
  },
});

// Get expense by ID
export const getExpense = query({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const expense = await ctx.db.get(args.expenseId);
    if (!expense || !expense.isActive) {
      return null;
    }

    let receiptUrl = null;
    if (expense.receipt) {
      receiptUrl = await ctx.storage.getUrl(expense.receipt);
    }

    return { ...expense, receiptUrl };
  },
});

// Update expense
export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    date: v.optional(v.number()),
    receipt: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    await ctx.db.patch(args.expenseId, {
      description: args.description,
      amount: args.amount,
      category: args.category,
      date: args.date,
      receipt: args.receipt,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    // Log the expense update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_EXPENSE",
      target: `expense:${args.expenseId}`,
      details: `Updated expense: ${expense.description}`,
    });

    return args.expenseId;
  },
});

// Delete expense
export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    await ctx.db.patch(args.expenseId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the expense deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_EXPENSE",
      target: `expense:${args.expenseId}`,
      details: `Deleted expense: ${expense.description}`,
    });

    return args.expenseId;
  },
});

// Get expense statistics
export const getExpenseStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      expenses = expenses.filter(expense => {
        if (args.startDate && expense.date < args.startDate) return false;
        if (args.endDate && expense.date > args.endDate) return false;
        return true;
      });
    }

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = expenses.length;

    // Group by category
    const byCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAmount,
      totalCount,
      byCategory,
      expenses: expenses.slice(0, 10), // Recent 10 expenses
    };
  },
});

// Generate upload URL for receipts
export const generateReceiptUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
