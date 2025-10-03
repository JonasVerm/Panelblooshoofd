import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all todos for a specific user
export const getUserTodos = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // If no userId provided, get current user's todos
    const targetUserId = args.userId || currentUserId;

    const todos = await ctx.db
      .query("todos")
      .withIndex("by_owner", (q) => q.eq("ownerId", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Get user info for each todo's creator
    const todosWithCreators = await Promise.all(
      todos.map(async (todo) => {
        const creator = await ctx.db.get(todo.createdBy);
        const owner = await ctx.db.get(todo.ownerId);
        return {
          ...todo,
          creator: creator ? { 
            _id: creator._id, 
            name: creator.name || "Unknown User",
            email: creator.email 
          } : null,
          owner: owner ? { 
            _id: owner._id, 
            name: owner.name || "Unknown User",
            email: owner.email 
          } : null,
        };
      })
    );

    return todosWithCreators;
  },
});

// Get all users (for selecting who to add tasks for)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const users = await ctx.db.query("users").collect();
    return users.map(user => ({
      _id: user._id,
      name: user.name || "Unknown User",
      email: user.email,
    }));
  },
});

// Create a new todo
export const createTodo = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.optional(v.id("users")), // If not provided, defaults to current user
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const ownerId = args.ownerId || currentUserId;

    const todoId = await ctx.db.insert("todos", {
      title: args.title,
      description: args.description || "",
      ownerId,
      createdBy: currentUserId,
      isCompleted: false,
      isActive: true,
      priority: args.priority || "medium",
      dueDate: args.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return todoId;
  },
});

// Update a todo
export const updateTodo = mutation({
  args: {
    id: v.id("todos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const todo = await ctx.db.get(args.id);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Only the owner or creator can update the todo
    if (todo.ownerId !== currentUserId && todo.createdBy !== currentUserId) {
      throw new Error("Not authorized to update this todo");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isCompleted !== undefined) updates.isCompleted = args.isCompleted;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;

    await ctx.db.patch(args.id, updates);
  },
});

// Delete a todo (soft delete)
export const deleteTodo = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const todo = await ctx.db.get(args.id);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Only the owner or creator can delete the todo
    if (todo.ownerId !== currentUserId && todo.createdBy !== currentUserId) {
      throw new Error("Not authorized to delete this todo");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Toggle todo completion
export const toggleTodoCompletion = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const todo = await ctx.db.get(args.id);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Only the owner can toggle completion
    if (todo.ownerId !== currentUserId) {
      throw new Error("Only the owner can mark todos as complete");
    }

    await ctx.db.patch(args.id, {
      isCompleted: !todo.isCompleted,
      updatedAt: Date.now(),
    });
  },
});
