import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Get backup data
export const getBackupData = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    // Get all documents with their folder paths
    const documents = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const folders = await ctx.db
      .query("folders")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Create folder path lookup
    const folderPaths = new Map();
    folders.forEach(folder => {
      folderPaths.set(folder._id, folder.path || folder.name);
    });

    // Add file URLs and folder paths to documents
    const documentsWithDetails = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        const folderPath = doc.folderId ? folderPaths.get(doc.folderId) : null;
        
        return {
          id: doc._id,
          title: doc.title || doc.name,
          description: doc.description,
          fileType: doc.fileType,
          documentDate: doc.documentDate,
          creationTime: doc._creationTime,
          folderPath,
          fileUrl: url,
          allowedRoles: doc.allowedRoles,
          allowedUserIds: doc.allowedUserIds,
        };
      })
    );

    return documentsWithDetails;
  },
});

// Log backup creation
export const logBackupCreation = mutation({
  args: { documentCount: v.number() },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Log the backup creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_BACKUP",
      target: "system",
      details: `Created backup with ${args.documentCount} documents`,
    });

    return true;
  },
});

// Create backup record
export const createBackupRecord = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const backupId = await ctx.db.insert("backups", {
      name: args.name,
      description: args.description,
      storageId: args.storageId,
      size: args.size,
      createdBy: currentUser._id,
      createdAt: Date.now(),
    });

    // Log the backup record creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_BACKUP_RECORD",
      target: `backup:${backupId}`,
      details: `Created backup record: ${args.name}`,
    });

    return backupId;
  },
});

// List backup records
export const listBackups = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const backups = await ctx.db
      .query("backups")
      .withIndex("by_created_at", (q) => q.gt("createdAt", 0))
      .order("desc")
      .collect();

    return backups;
  },
});
