import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getCurrentUser(ctx: any) {
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

// Upload media to library
export const addMediaToLibrary = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const mediaId = await ctx.db.insert("mediaLibrary", {
      name: args.name,
      description: args.description,
      storageId: args.storageId,
      mimeType: args.mimeType,
      size: args.size,
      tags: args.tags || [],
      category: args.category,
      uploadedBy: currentUser._id,
      isActive: true,
      createdAt: Date.now(),
    });

    return mediaId;
  },
});

// List media library items
export const listMediaLibrary = query({
  args: {
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let media = await ctx.db
      .query("mediaLibrary")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Filter by category if provided
    if (args.category) {
      media = media.filter(item => item.category === args.category);
    }

    // Filter by tags if provided
    if (args.tags && args.tags.length > 0) {
      media = media.filter(item => 
        args.tags!.some(tag => item.tags?.includes(tag))
      );
    }

    // Enrich with URLs and uploader info
    const enrichedMedia = await Promise.all(
      media.map(async (item) => {
        const url = await ctx.storage.getUrl(item.storageId);
        const uploader = await ctx.db.get(item.uploadedBy);
        
        return {
          ...item,
          url,
          uploader,
        };
      })
    );

    return enrichedMedia;
  },
});

// Get media item by ID
export const getMediaItem = query({
  args: { mediaId: v.id("mediaLibrary") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const media = await ctx.db.get(args.mediaId);
    if (!media || !media.isActive) {
      return null;
    }

    const url = await ctx.storage.getUrl(media.storageId);
    const uploader = await ctx.db.get(media.uploadedBy);

    return {
      ...media,
      url,
      uploader,
    };
  },
});

// Generate upload URL for media
export const generateMediaUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Delete media item
export const deleteMediaItem = mutation({
  args: { mediaId: v.id("mediaLibrary") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const media = await ctx.db.get(args.mediaId);
    if (!media) {
      throw new Error("Media item not found");
    }

    await ctx.db.patch(args.mediaId, {
      isActive: false,
    });

    return args.mediaId;
  },
});

// Get media categories
export const getMediaCategories = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const media = await ctx.db
      .query("mediaLibrary")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = [...new Set(media.map(item => item.category).filter(Boolean))];
    return categories.sort();
  },
});
