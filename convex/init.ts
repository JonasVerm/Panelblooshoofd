import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Initialize the app with seed data
export const initializeApp = internalMutation({
  args: {},
  handler: async (ctx) => {
    // App initialization complete
    console.log("App initialized successfully");
  },
});

// Public initialization function (for development)
export const initializeAppPublic = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.init.initializeApp, {});
  },
});
