import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// List folders
export const listFolders = query({
  args: {
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) => 
        args.parentId ? q.eq("parentId", args.parentId) : q.eq("parentId", undefined)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return folders;
  },
});

// Create folder
export const createFolder = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("folders")),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    allowedRoles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Build path
    let path = args.name;
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (parent) {
        path = parent.path ? `${parent.path}/${args.name}` : args.name;
      }
    }

    const folderId = await ctx.db.insert("folders", {
      name: args.name,
      parentId: args.parentId,
      path,
      allowedUserIds: args.allowedUserIds,
      allowedRoles: args.allowedRoles,
      isActive: true,
      createdBy: currentUser._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the folder creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_FOLDER",
      target: `folder:${folderId}`,
      details: `Created folder: ${args.name}`,
    });

    return folderId;
  },
});

// Get folder tree
export const getFolderTree = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const folders = await ctx.db
      .query("folders")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Build tree structure
    const folderMap = new Map();
    const rootFolders: any[] = [];

    // First pass: create folder objects
    folders.forEach(folder => {
      folderMap.set(folder._id, { ...folder, children: [] });
    });

    // Second pass: build tree
    folders.forEach(folder => {
      const folderObj = folderMap.get(folder._id);
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderObj);
        }
      } else {
        rootFolders.push(folderObj);
      }
    });

    return rootFolders;
  },
});

// Update folder
export const updateFolder = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.optional(v.string()),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    allowedRoles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    await ctx.db.patch(args.folderId, {
      name: args.name,
      allowedUserIds: args.allowedUserIds,
      allowedRoles: args.allowedRoles,
      updatedAt: Date.now(),
    });

    // Log the folder update
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_FOLDER",
      target: `folder:${args.folderId}`,
      details: `Updated folder: ${folder.name}`,
    });

    return args.folderId;
  },
});

// Delete folder
export const deleteFolder = mutation({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    await ctx.db.patch(args.folderId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the folder deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_FOLDER",
      target: `folder:${args.folderId}`,
      details: `Deleted folder: ${folder.name}`,
    });

    return args.folderId;
  },
});
