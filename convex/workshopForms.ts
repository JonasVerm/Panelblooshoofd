import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Get workshop form config
export const getWorkshopFormConfig = query({
  args: { workshopId: v.id("workshops") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const config = await ctx.db
      .query("workshopFormConfigs")
      .withIndex("by_workshop", (q) => q.eq("workshopId", args.workshopId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return config;
  },
});

// Update workshop form config
export const updateWorkshopFormConfig = mutation({
  args: {
    workshopId: v.id("workshops"),
    fields: v.array(v.object({
      id: v.string(),
      type: v.string(),
      label: v.string(),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
      placeholder: v.optional(v.string()),
      defaultValue: v.optional(v.string()),
      order: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const existingConfig = await ctx.db
      .query("workshopFormConfigs")
      .withIndex("by_workshop", (q) => q.eq("workshopId", args.workshopId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        fields: args.fields,
        updatedBy: currentUser._id,
        updatedAt: Date.now(),
      });
      return existingConfig._id;
    } else {
      const configId = await ctx.db.insert("workshopFormConfigs", {
        workshopId: args.workshopId,
        fields: args.fields,
        updatedBy: currentUser._id,
        isActive: true,
        createdBy: currentUser._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return configId;
    }
  },
});

// Create workshop registration
export const createWorkshopRegistration = mutation({
  args: {
    workshopId: v.id("workshops"),
    participantName: v.string(),
    participantEmail: v.string(),
    participantPhone: v.optional(v.string()),
    formData: v.object({}),
  },
  handler: async (ctx, args) => {
    const registrationId = await ctx.db.insert("workshopRegistrations", {
      workshopId: args.workshopId,
      participantName: args.participantName,
      participantEmail: args.participantEmail,
      participantPhone: args.participantPhone,
      formData: args.formData,
      status: "pending",
      paymentStatus: "pending",
      registrationDate: Date.now(),
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return registrationId;
  },
});

// List workshop registrations
export const listWorkshopRegistrations = query({
  args: { workshopId: v.id("workshops") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const registrations = await ctx.db
      .query("workshopRegistrations")
      .withIndex("by_workshop", (q) => q.eq("workshopId", args.workshopId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    return registrations;
  },
});
