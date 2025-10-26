import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Generate share link for document
export const generateShareLink = mutation({
  args: {
    documentId: v.id("documents"),
    expiresAt: v.optional(v.number()),
    viewOnly: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const document = await ctx.db.get(args.documentId);
    
    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user can access the document
    const canAccess = document.createdBy === currentUser._id ||
                     (document.allowedUserIds?.includes(currentUser._id) ?? false);
    
    if (!canAccess) {
      throw new Error("Access denied");
    }

    // Generate unique token
    const token = crypto.randomUUID();

    const shareLinkId = await ctx.db.insert("shareLinks", {
      documentId: args.documentId,
      token,
      createdBy: currentUser._id,
      expiresAt: args.expiresAt,
      viewOnly: args.viewOnly,
      accessCount: 0,
      requiresPassword: false,
      isActive: true,
      createdAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_SHARE_LINK",
      target: `document:${args.documentId}`,
      details: `Created share link for document ${document.title || document.name}`,
    });

    return shareLinkId;
  },
});

// Get share links for a document
export const getShareLinks = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const document = await ctx.db.get(args.documentId);
    
    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user can access the document
    const canAccess = document.createdBy === currentUser._id ||
                     (document.allowedUserIds?.includes(currentUser._id) ?? false);
    
    if (!canAccess) {
      throw new Error("Access denied");
    }

    return await ctx.db
      .query("shareLinks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
  },
});

// Get document by share token (public access)
export const getDocumentByShareToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const shareLink = await ctx.db
      .query("shareLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!shareLink) {
      throw new Error("Invalid share link");
    }

    // Check if link has expired
    if (shareLink.expiresAt && shareLink.expiresAt < Date.now()) {
      throw new Error("Share link has expired");
    }

    // Check if max access count reached
    if (shareLink.maxAccess && (shareLink.accessCount || 0) >= shareLink.maxAccess) {
      throw new Error("Share link access limit reached");
    }

    const document = await ctx.db.get(shareLink.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Increment access count
    await ctx.db.patch(shareLink._id, {
      accessCount: (shareLink.accessCount || 0) + 1,
    });

    return {
      document,
      shareLink: {
        ...shareLink,
        viewOnly: shareLink.viewOnly,
      },
    };
  },
});

// Delete share link
export const deleteShareLink = mutation({
  args: {
    shareLinkId: v.id("shareLinks"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const shareLink = await ctx.db.get(args.shareLinkId);
    
    if (!shareLink) {
      throw new Error("Share link not found");
    }

    const document = await ctx.db.get(shareLink.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user can access the document
    const canAccess = document.createdBy === currentUser._id ||
                     (document.allowedUserIds?.includes(currentUser._id) ?? false);
    
    if (!canAccess) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.shareLinkId);

    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_SHARE_LINK",
      target: `document:${shareLink.documentId}`,
      details: `Deleted share link for document ${document.title || document.name}`,
    });
  },
});

// Get all share links for current user
export const getAllShareLinks = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    
    const shareLinks = await ctx.db
      .query("shareLinks")
      .withIndex("by_created_by", (q) => q.eq("createdBy", currentUser._id))
      .collect();

    // Get document info for each share link
    const shareLinksWithDocuments = await Promise.all(
      shareLinks.map(async (shareLink) => {
        const document = await ctx.db.get(shareLink.documentId);
        return {
          ...shareLink,
          document: document ? {
            _id: document._id,
            name: document.name,
            title: document.title,
            fileType: document.fileType,
          } : null,
        };
      })
    );

    return shareLinksWithDocuments.filter(link => link.document !== null);
  },
});

// Get document info for shared access (public)
export const getSharedDocumentInfo = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const shareLink = await ctx.db
      .query("shareLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!shareLink) {
      return null;
    }

    const document = await ctx.db.get(shareLink.documentId);
    if (!document) {
      return null;
    }

    return {
      documentTitle: document.title || document.name || "Unknown Document",
      requiresPassword: shareLink.requiresPassword,
      isExpired: shareLink.expiresAt ? shareLink.expiresAt < Date.now() : false,
      accessLimitReached: shareLink.maxAccess ? (shareLink.accessCount || 0) >= shareLink.maxAccess : false,
    };
  },
});
