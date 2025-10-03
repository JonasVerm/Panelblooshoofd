import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Search documents
export const searchDocuments = query({
  args: {
    searchTerm: v.string(),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let query = ctx.db
      .query("documents")
      .withSearchIndex("search_documents", (q) => q.search("name", args.searchTerm));

    if (args.folderId) {
      query = query.filter((q) => q.eq(q.field("folderId"), args.folderId));
    }

    const results = await query.collect();

    // Add file URLs to results
    const documentsWithUrls = await Promise.all(
      results.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, url };
      })
    );

    return documentsWithUrls;
  },
});

// List documents in folder
export const listDocuments = query({
  args: {
    folderId: v.optional(v.id("folders")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let documents;
    
    if (args.folderId) {
      documents = await ctx.db
        .query("documents")
        .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(args.limit || 50);
    } else {
      documents = await ctx.db
        .query("documents")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(args.limit || 50);
    }



    // Add file URLs to results
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, url };
      })
    );

    return documentsWithUrls;
  },
});

// Get single document
export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const document = await ctx.db.get(args.documentId);
    if (!document || !document.isActive) {
      return null;
    }

    const url = await ctx.storage.getUrl(document.storageId);
    return { ...document, url };
  },
});

// Create document
export const createDocument = mutation({
  args: {
    name: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    fileType: v.optional(v.string()),
    size: v.number(),
    documentDate: v.optional(v.number()),
    allowedRoles: v.optional(v.array(v.string())),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const documentId = await ctx.db.insert("documents", {
      name: args.name,
      title: args.title,
      description: args.description,
      folderId: args.folderId,
      storageId: args.storageId,
      mimeType: args.mimeType,
      fileType: args.fileType,
      size: args.size,
      documentDate: args.documentDate || Date.now(),
      allowedRoles: args.allowedRoles,
      allowedUserIds: args.allowedUserIds,
      starredBy: [],
      tags: args.tags,
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the document creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_DOCUMENT",
      target: `document:${documentId}`,
      details: `Created document: ${args.name}`,
    });

    return documentId;
  },
});

// Update document
export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    name: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    documentDate: v.optional(v.number()),
    allowedRoles: v.optional(v.array(v.string())),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.documentId, {
      name: args.name,
      title: args.title,
      description: args.description,
      folderId: args.folderId,
      documentDate: args.documentDate,
      allowedRoles: args.allowedRoles,
      allowedUserIds: args.allowedUserIds,
      tags: args.tags,
      updatedAt: Date.now(),
    });

    // Log the document update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_DOCUMENT",
      target: `document:${args.documentId}`,
      details: `Updated document: ${document.name}`,
    });

    return args.documentId;
  },
});

// Delete document
export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.documentId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the document deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_DOCUMENT",
      target: `document:${args.documentId}`,
      details: `Deleted document: ${document.name}`,
    });

    return args.documentId;
  },
});

// Toggle star on document
export const toggleStar = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const starredBy = document.starredBy || [];
    const isStarred = starredBy.includes(currentUser._id);

    const updatedStarredBy = isStarred
      ? starredBy.filter(id => id !== currentUser._id)
      : [...starredBy, currentUser._id];

    await ctx.db.patch(args.documentId, {
      starredBy: updatedStarredBy,
      updatedAt: Date.now(),
    });

    return !isStarred;
  },
});

// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Get starred documents
export const getStarredDocuments = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const documents = await ctx.db
      .query("documents")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.neq(q.field("starredBy"), undefined)
        )
      )
      .collect();

    const starredDocuments = documents.filter(doc => 
      (doc.starredBy || []).includes(currentUser._id)
    );

    // Add file URLs to results
    const documentsWithUrls = await Promise.all(
      starredDocuments.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, url };
      })
    );

    return documentsWithUrls;
  },
});

// Get recent documents
export const getRecentDocuments = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(args.limit || 10);

    // Add file URLs to results
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, url };
      })
    );

    return documentsWithUrls;
  },
});
