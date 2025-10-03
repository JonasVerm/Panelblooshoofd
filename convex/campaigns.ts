import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
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

// Create campaign
export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    color: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      color: args.color || "#3B82F6",
      tags: args.tags || [],
      createdBy: currentUser._id,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the campaign creation
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "CREATE_CAMPAIGN",
      target: `campaign:${campaignId}`,
      details: `Created campaign: ${args.name}`,
    });

    return campaignId;
  },
});

// List campaigns
export const listCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const campaigns = await ctx.db
      .query("campaigns")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Enrich with post counts
    const enrichedCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        const posts = await ctx.db
          .query("socialMediaPosts")
          .withIndex("by_campaign", (q) => q.eq("campaignId", campaign._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        const creator = await ctx.db.get(campaign.createdBy);

        return {
          ...campaign,
          postCount: posts.length,
          creator,
        };
      })
    );

    return enrichedCampaigns;
  },
});

// Get campaign with posts
export const getCampaignWithPosts = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || !campaign.isActive) {
      return null;
    }

    const posts = await ctx.db
      .query("socialMediaPosts")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Enrich posts with user data
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const assignedUser = post.assignedTo ? await ctx.db.get(post.assignedTo) : null;
        const creator = await ctx.db.get(post.createdBy);
        
        return {
          ...post,
          assignedUser,
          creator,
        };
      })
    );

    const creator = await ctx.db.get(campaign.createdBy);

    return {
      ...campaign,
      posts: enrichedPosts,
      creator,
    };
  },
});

// Update campaign
export const updateCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    color: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const { campaignId, ...updateData } = args;
    await ctx.db.patch(campaignId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    return campaignId;
  },
});

// Delete campaign
export const deleteCampaign = mutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    await ctx.db.patch(args.campaignId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Log the deletion
    await ctx.runMutation(internal.audit.log, {
      actor: currentUser._id,
      action: "DELETE_CAMPAIGN",
      target: `campaign:${args.campaignId}`,
      details: `Deleted campaign: ${campaign.name}`,
    });

    return args.campaignId;
  },
});
