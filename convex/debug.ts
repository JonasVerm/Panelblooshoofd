import { query } from "./_generated/server";

export const debugWorkshops = query({
  args: {},
  handler: async (ctx) => {
    const workshops = await ctx.db.query("workshops").collect();
    
    return workshops.map(w => ({
      id: w._id,
      title: w.title,
      date: w.datum ? new Date(w.datum).toISOString() : "No date",
      startTime: w.startTime,
      endTime: w.endTime,
      location: w.location,
      maxParticipants: w.maxParticipants,
      price: w.price,
      category: w.category,
      isActive: w.isActive,
      createdAt: new Date(w._creationTime).toISOString(),
    }));
  },
});

export const debugMembers = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("members").collect();
    
    return {
      total: members.length,
      active: members.filter(m => m.isActive).length,
      inactive: members.filter(m => !m.isActive).length,
      withEmail: members.filter(m => m.emailAdres).length,
      withPhone: members.filter(m => m.gsmNummer).length,
    };
  },
});

export const debugActivities = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    
    return {
      total: activities.length,
      active: activities.filter(a => a.isActive).length,
      oneTime: activities.filter(a => a.type === "eenmalig").length,
      recurring: activities.filter(a => a.type === "herhalend").length,
    };
  },
});
