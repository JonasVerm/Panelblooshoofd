import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get default workshop form template
export const getDefaultFormTemplate = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const defaultTemplate = await ctx.db
      .query("workshopFormTemplates")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!defaultTemplate) {
      // Return a basic default template if none exists
      return {
        name: "Standaard Workshop Formulier",
        fields: [
          {
            id: "title",
            type: "text" as const,
            label: "Workshop Titel",
            placeholder: "Voer workshop titel in",
            required: true,
            order: 1,
          },
          {
            id: "description",
            type: "textarea" as const,
            label: "Beschrijving",
            placeholder: "Voer workshop beschrijving in",
            required: false,
            order: 2,
          },
          {
            id: "date",
            type: "date" as const,
            label: "Datum",
            required: true,
            order: 3,
          },
          {
            id: "startTime",
            type: "text" as const,
            label: "Starttijd",
            placeholder: "09:00",
            required: true,
            order: 4,
          },
          {
            id: "endTime",
            type: "text" as const,
            label: "Eindtijd",
            placeholder: "17:00",
            required: true,
            order: 5,
          },
          {
            id: "location",
            type: "text" as const,
            label: "Locatie",
            placeholder: "Voer locatie in",
            required: true,
            order: 6,
          },
          {
            id: "teacherId",
            type: "select" as const,
            label: "Docent",
            placeholder: "Selecteer een docent",
            required: false,
            order: 7,
          },
          {
            id: "maxParticipants",
            type: "number" as const,
            label: "Max Deelnemers",
            placeholder: "20",
            required: true,
            order: 8,
          },
          {
            id: "price",
            type: "number" as const,
            label: "Prijs (€)",
            placeholder: "0.00",
            required: true,
            order: 9,
          },
        ],
      };
    }

    return defaultTemplate;
  },
});

// Get all form templates
export const getFormTemplates = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    return await ctx.db
      .query("workshopFormTemplates")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

// Create or update form template
export const saveFormTemplate = mutation({
  args: {
    id: v.optional(v.id("workshopFormTemplates")),
    name: v.string(),
    description: v.optional(v.string()),
    fields: v.array(v.object({
      id: v.string(),
      type: v.union(v.literal("text"), v.literal("textarea"), v.literal("select"), v.literal("radio"), v.literal("checkbox"), v.literal("email"), v.literal("tel"), v.literal("number"), v.literal("date")),
      label: v.string(),
      placeholder: v.optional(v.string()),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
      defaultValue: v.optional(v.string()),
      order: v.number(),
    })),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // If setting as default, unset other defaults first
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("workshopFormTemplates")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .collect();

      for (const template of existingDefaults) {
        await ctx.db.patch(template._id, { isDefault: false });
      }
    }

    if (args.id) {
      // Update existing template
      await ctx.db.patch(args.id, {
        name: args.name,
        description: args.description,
        fields: args.fields,
        isDefault: args.isDefault || false,
        updatedAt: Date.now(),
      });
      return args.id;
    } else {
      // Create new template
      return await ctx.db.insert("workshopFormTemplates", {
        name: args.name,
        description: args.description,
        fields: args.fields,
        isDefault: args.isDefault || false,
        isActive: true,
        createdBy: currentUser._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete form template
export const deleteFormTemplate = mutation({
  args: { id: v.id("workshopFormTemplates") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
