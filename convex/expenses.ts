import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Generate upload URL for receipts
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get receipt URL
export const getReceiptUrl = query({
  args: { receiptId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.receiptId);
  },
});

// Create expense
export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    date: v.number(),
    receipt: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const expenseId = await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      date: args.date,
      receipt: args.receipt,
      notes: args.notes,
      status: "pending", // Default status
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
      details: `Created expense: ${args.description} - €${args.amount.toFixed(2)}`,
    });

    return expenseId;
  },
});

// List expenses
export const listExpenses = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(args.limit || 50);

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      expenses = expenses.filter(expense => {
        if (args.startDate && expense.date < args.startDate) return false;
        if (args.endDate && expense.date > args.endDate) return false;
        return true;
      });
    }

    return expenses;
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

    return expense;
  },
});

// Update expense
export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    date: v.optional(v.number()),
    receipt: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
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
      date: args.date,
      receipt: args.receipt,
      notes: args.notes,
      status: args.status,
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
    const approvedAmount = expenses
      .filter(e => e.status === "approved")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const pendingAmount = expenses
      .filter(e => e.status === "pending")
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      totalExpenses: expenses.length,
      totalAmount,
      approvedAmount,
      pendingAmount,
      statusBreakdown: {
        pending: expenses.filter(e => e.status === "pending").length,
        approved: expenses.filter(e => e.status === "approved").length,
        rejected: expenses.filter(e => e.status === "rejected").length,
      },
    };
  },
});

// Update expense status (for admin use)
export const updateExpenseStatus = mutation({
  args: {
    expenseId: v.id("expenses"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) {
      throw new Error("Expense not found");
    }

    await ctx.db.patch(args.expenseId, {
      status: args.status,
      notes: args.notes || expense.notes,
      updatedAt: Date.now(),
    });

    // Log the status update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_EXPENSE_STATUS",
      target: `expense:${args.expenseId}`,
      details: `Updated expense status to ${args.status}: ${expense.description}`,
    });

    return args.expenseId;
  },
});
