import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// List passwords
export const listPasswords = query({
  args: {
    category: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let passwords;

    if (args.searchTerm) {
      passwords = await ctx.db
        .query("passwords")
        .withSearchIndex("search_passwords", (q) => 
          q.search("title", args.searchTerm!)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      passwords = await ctx.db
        .query("passwords")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .collect();
    }

    // Filter by category if provided
    if (args.category) {
      passwords = passwords.filter(p => p.category === args.category);
    }

    return passwords;
  },
});

// Get password by ID
export const getPassword = query({
  args: { passwordId: v.id("passwords") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const password = await ctx.db.get(args.passwordId);
    if (!password || !password.isActive) {
      return null;
    }

    return password;
  },
});

// Create password
export const createPassword = mutation({
  args: {
    title: v.string(),
    username: v.optional(v.string()),
    password: v.string(),
    website: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sharedWith: v.optional(v.array(v.id("users"))),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    allowedRoles: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const passwordId = await ctx.db.insert("passwords", {
      title: args.title,
      username: args.username,
      password: args.password,
      website: args.website,
      url: args.url,
      notes: args.notes,
      description: args.description,
      category: args.category,
      sharedWith: args.sharedWith,
      allowedUserIds: args.allowedUserIds,
      allowedRoles: args.allowedRoles,
      tags: args.tags,
      lastModified: Date.now(),
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the password creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_PASSWORD",
      target: `password:${passwordId}`,
      details: `Created password: ${args.title}`,
    });

    return passwordId;
  },
});

// Update password
export const updatePassword = mutation({
  args: {
    id: v.optional(v.id("passwords")),
    passwordId: v.optional(v.id("passwords")),
    title: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    website: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sharedWith: v.optional(v.array(v.id("users"))),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    allowedRoles: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const passwordId = args.id || args.passwordId;
    if (!passwordId) {
      throw new Error("Password ID is required");
    }
    
    const password = await ctx.db.get(passwordId);
    if (!password) {
      throw new Error("Password not found");
    }

    await ctx.db.patch(passwordId, {
      title: args.title,
      username: args.username,
      password: args.password,
      website: args.website,
      url: args.url,
      notes: args.notes,
      description: args.description,
      category: args.category,
      sharedWith: args.sharedWith,
      allowedUserIds: args.allowedUserIds,
      allowedRoles: args.allowedRoles,
      tags: args.tags,
      lastModified: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the password update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_PASSWORD",
      target: `password:${passwordId}`,
      details: `Updated password: ${password.title}`,
    });

    return passwordId;
  },
});

// Delete password
export const deletePassword = mutation({
  args: { 
    id: v.optional(v.id("passwords")),
    passwordId: v.optional(v.id("passwords"))
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const passwordId = args.id || args.passwordId;
    if (!passwordId) {
      throw new Error("Password ID is required");
    }
    
    const password = await ctx.db.get(passwordId);
    if (!password) {
      throw new Error("Password not found");
    }

    await ctx.db.patch(passwordId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the password deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_PASSWORD",
      target: `password:${passwordId}`,
      details: `Deleted password: ${password.title}`,
    });

    return passwordId;
  },
});

// Get password categories
export const getPasswordCategories = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const passwords = await ctx.db
      .query("passwords")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = [...new Set(passwords.map(p => p.category).filter(Boolean))];
    return categories.sort();
  },
});

// Aliases for PasswordsApp compatibility
export const getPasswords = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const passwords = await ctx.db
      .query("passwords")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    return passwords.map(password => ({
      ...password,
      strength: calculatePasswordStrength(password.password),
    }));
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const passwords = await ctx.db
      .query("passwords")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = [...new Set(passwords.map(p => p.category).filter(Boolean))];
    return categories.sort();
  },
});

// Helper function to calculate password strength
function calculatePasswordStrength(password: string): "weak" | "medium" | "strong" {
  if (!password) return "weak";
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}
