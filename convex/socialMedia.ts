import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
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

// Create social media post
export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    status: v.union(
      v.literal("idea"),
      v.literal("concept"),
      v.literal("review"),
      v.literal("ready"),
      v.literal("posted")
    ),
    scheduledDate: v.optional(v.number()),
    platform: v.optional(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    assignedTo: v.optional(v.id("users")),
    mediaIds: v.optional(v.array(v.id("_storage"))),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const postId = await ctx.db.insert("socialMediaPosts", {
      title: args.title,
      content: args.content,
      status: args.status,
      scheduledDate: args.scheduledDate,
      platform: args.platform,
      campaignId: args.campaignId,
      assignedTo: args.assignedTo || currentUser._id,
      mediaIds: args.mediaIds || [],
      tags: args.tags || [],
      priority: args.priority || "medium",
      createdBy: currentUser._id,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the post creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_SOCIAL_POST",
      target: `post:${postId}`,
      details: `Created social media post: ${args.title}`,
    });

    return postId;
  },
});

// Update post status (for kanban flow)
export const updatePostStatus = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    status: v.union(
      v.literal("idea"),
      v.literal("concept"),
      v.literal("review"),
      v.literal("ready"),
      v.literal("posted")
    ),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.patch(args.postId, {
      status: args.status,
      assignedTo: args.assignedTo,
      updatedAt: Date.now(),
    });

    // Log status change
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "UPDATE_POST_STATUS",
      target: `post:${args.postId}`,
      details: `Changed status to ${args.status}`,
    });

    return args.postId;
  },
});

// Get posts by status (for kanban board)
export const getPostsByStatus = query({
  args: {
    status: v.optional(v.union(
      v.literal("idea"),
      v.literal("concept"),
      v.literal("review"),
      v.literal("ready"),
      v.literal("posted")
    )),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let posts;
    if (args.status) {
      posts = await ctx.db
        .query("socialMediaPosts")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .collect();
    } else {
      posts = await ctx.db
        .query("socialMediaPosts")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .collect();
    }

    // Enrich with user data
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const assignedUser = post.assignedTo ? await ctx.db.get(post.assignedTo) : null;
        const creator = await ctx.db.get(post.createdBy);
        const campaign = post.campaignId ? await ctx.db.get(post.campaignId) : null;
        
        return {
          ...post,
          assignedUser,
          creator,
          campaign,
        };
      })
    );

    return enrichedPosts;
  },
});

// Get posts for calendar view
export const getPostsForCalendar = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const posts = await ctx.db
      .query("socialMediaPosts")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gte(q.field("scheduledDate"), args.startDate),
          q.lte(q.field("scheduledDate"), args.endDate)
        )
      )
      .collect();

    // Enrich with user data
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const assignedUser = post.assignedTo ? await ctx.db.get(post.assignedTo) : null;
        const campaign = post.campaignId ? await ctx.db.get(post.campaignId) : null;
        
        return {
          ...post,
          assignedUser,
          campaign,
        };
      })
    );

    return enrichedPosts;
  },
});

// Update post content
export const updatePost = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    platform: v.optional(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    assignedTo: v.optional(v.id("users")),
    mediaIds: v.optional(v.array(v.id("_storage"))),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const { postId, ...updateData } = args;
    await ctx.db.patch(postId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return postId;
  },
});

// Add comment to post
export const addComment = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    content: v.string(),
    type: v.optional(v.union(v.literal("comment"), v.literal("feedback"), v.literal("approval"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const commentId = await ctx.db.insert("postComments", {
      postId: args.postId,
      content: args.content,
      type: args.type || "comment",
      authorId: currentUser._id,
      isActive: true,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

// Get comments for post
export const getPostComments = query({
  args: { postId: v.id("socialMediaPosts") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const comments = await ctx.db
      .query("postComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();

    // Enrich with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author,
        };
      })
    );

    return enrichedComments;
  },
});

// Delete post
export const deletePost = mutation({
  args: { postId: v.id("socialMediaPosts") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.patch(args.postId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_SOCIAL_POST",
      target: `post:${args.postId}`,
      details: `Deleted social media post: ${post.title}`,
    });

    return args.postId;
  },
});

// Get post by ID
export const getPost = query({
  args: { postId: v.id("socialMediaPosts") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const post = await ctx.db.get(args.postId);
    if (!post || !post.isActive) {
      return null;
    }

    const assignedUser = post.assignedTo ? await ctx.db.get(post.assignedTo) : null;
    const creator = await ctx.db.get(post.createdBy);
    const campaign = post.campaignId ? await ctx.db.get(post.campaignId) : null;

    return {
      ...post,
      assignedUser,
      creator,
      campaign,
    };
  },
});
