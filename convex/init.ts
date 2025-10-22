import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Initialize the app with seed data
export const initializeApp = internalMutation({
  args: {},
  handler: async (ctx) => {
    // App initialization complete
    console.log("App initialized successfully");
  },
});

// Create sample rooms
export const createSampleRooms = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.query("rooms").collect();
    if (existing.length > 0) return "Rooms exist";

    await ctx.db.insert("rooms", {
      name: "Vergaderzaal A",
      description: "Grote vergaderzaal met beamer",
      capacity: 12,
      equipment: ["Beamer", "WiFi"],
      color: "#3B82F6",
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return "Rooms created!";
  },
});

// Public initialization function (for development)
export const initializeAppPublic = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.init.initializeApp, {});
  },
});
