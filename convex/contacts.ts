import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Get all contact categories
export const getContactCategories = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    
    return await ctx.db
      .query("contactCategories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Create contact category
export const createContactCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const categoryId = await ctx.db.insert("contactCategories", {
      name: args.name,
      description: args.description,
      color: args.color || "#3B82F6",
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_CONTACT_CATEGORY",
      target: `contactCategory:${categoryId}`,
      details: `Created contact category: ${args.name}`,
    });

    return categoryId;
  },
});

// Update contact category
export const updateContactCategory = mutation({
  args: {
    categoryId: v.id("contactCategories"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(args.categoryId, {
      name: args.name,
      description: args.description,
      color: args.color,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_CONTACT_CATEGORY",
      target: `contactCategory:${args.categoryId}`,
      details: `Updated contact category: ${args.name}`,
    });
  },
});

// Delete contact category
export const deleteContactCategory = mutation({
  args: {
    categoryId: v.id("contactCategories"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if category has contacts
    const contactsInCategory = await ctx.db
      .query("contacts")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    if (contactsInCategory.length > 0) {
      throw new Error("Cannot delete category with contacts. Move contacts to another category first.");
    }

    await ctx.db.patch(args.categoryId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_CONTACT_CATEGORY",
      target: `contactCategory:${args.categoryId}`,
      details: `Deleted contact category: ${category.name}`,
    });
  },
});

// Get all contacts
export const getContacts = query({
  args: {
    categoryId: v.optional(v.id("contactCategories")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    let query = ctx.db
      .query("contacts")
      .withIndex("by_active", (q) => q.eq("isActive", true));

    if (args.categoryId) {
      query = ctx.db
        .query("contacts")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId).eq("isActive", true));
    }

    const contacts = await query.collect();

    // Get category info for each contact
    const contactsWithCategories = await Promise.all(
      contacts.map(async (contact) => {
        const category = contact.categoryId ? await ctx.db.get(contact.categoryId) : null;
        return {
          ...contact,
          category: category ? {
            _id: category._id,
            name: category.name,
            color: category.color,
          } : null,
        };
      })
    );

    return contactsWithCategories;
  },
});

// Create contact
export const createContact = mutation({
  args: {
    name: v.string(),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    categoryId: v.optional(v.id("contactCategories")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const contactId = await ctx.db.insert("contacts", {
      name: args.name,
      phoneNumber: args.phoneNumber,
      email: args.email,
      company: args.company,
      categoryId: args.categoryId,
      notes: args.notes,
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_CONTACT",
      target: `contact:${contactId}`,
      details: `Created contact: ${args.name}`,
    });

    return contactId;
  },
});

// Update contact
export const updateContact = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.string(),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    categoryId: v.optional(v.id("contactCategories")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    await ctx.db.patch(args.contactId, {
      name: args.name,
      phoneNumber: args.phoneNumber,
      email: args.email,
      company: args.company,
      categoryId: args.categoryId,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_CONTACT",
      target: `contact:${args.contactId}`,
      details: `Updated contact: ${args.name}`,
    });
  },
});

// Delete contact
export const deleteContact = mutation({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    await ctx.db.patch(args.contactId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_CONTACT",
      target: `contact:${args.contactId}`,
      details: `Deleted contact: ${contact.name}`,
    });
  },
});

// Search contacts
export const searchContacts = query({
  args: {
    searchTerm: v.string(),
    categoryId: v.optional(v.id("contactCategories")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const contacts = await ctx.db
      .query("contacts")
      .withSearchIndex("search_contacts", (q) => 
        q.search("name", args.searchTerm).eq("isActive", true)
      )
      .collect();

    // Filter by category if specified
    const filteredContacts = args.categoryId 
      ? contacts.filter(contact => contact.categoryId === args.categoryId)
      : contacts;

    // Get category info for each contact
    const contactsWithCategories = await Promise.all(
      filteredContacts.map(async (contact) => {
        const category = contact.categoryId ? await ctx.db.get(contact.categoryId) : null;
        return {
          ...contact,
          category: category ? {
            _id: category._id,
            name: category.name,
            color: category.color,
          } : null,
        };
      })
    );

    return contactsWithCategories;
  },
});
