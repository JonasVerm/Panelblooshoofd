import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const getAttendanceReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    groupId: v.optional(v.id("memberGroups")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get activities in date range
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_date", (q) => 
        q.gte("datum", args.startDate).lte("datum", args.endDate)
      )
      .collect();

    // Get all attendance records for these activities
    const attendanceRecords = [];
    for (const activity of activities) {
      const records = await ctx.db
        .query("attendance")
        .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
        .collect();
      attendanceRecords.push(...records);
    }

    // Get members (filtered by group if specified)
    let members = await ctx.db.query("members").collect();
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (group && group.memberIds) {
        members = members.filter(m => group.memberIds!.includes(m._id));
      }
    }

    // Calculate attendance statistics per member
    const memberStats = [];
    for (const member of members) {
      const memberAttendance = attendanceRecords.filter(r => r.memberId === member._id);
      const present = memberAttendance.filter(r => r.status === "aanwezig").length;
      const absent = memberAttendance.filter(r => r.status === "afwezig").length;
      const total = present + absent;
      const attendancePercentage = total > 0 ? (present / total) * 100 : 0;

      // Get member's group
      let groupName = "No Group";
      if (member.groupIds && member.groupIds.length > 0) {
        const memberGroup = await ctx.db.get(member.groupIds[0]);
        if (memberGroup) {
          groupName = memberGroup.naam;
        }
      }

      memberStats.push({
        memberName: `${member.voornaam} ${member.naam}`,
        memberEmail: member.emailAdres || "",
        groupName,
        present,
        absent,
        attendancePercentage,
      });
    }

    // Calculate summary statistics
    const totalActivities = activities.length;
    const totalAttendances = attendanceRecords.filter(r => r.status === "aanwezig").length;
    const totalPossibleAttendances = attendanceRecords.length;
    const averageAttendance = totalPossibleAttendances > 0 ? (totalAttendances / totalPossibleAttendances) * 100 : 0;
    const activeMembers = members.filter(m => m.isActive).length;

    return {
      summary: {
        totalActivities,
        averageAttendance,
        activeMembers,
        totalAttendances,
      },
      details: memberStats,
    };
  },
});

export const getActivitiesReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get activities in date range
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_date", (q) => 
        q.gte("datum", args.startDate).lte("datum", args.endDate)
      )
      .collect();

    // Get attendance for each activity
    const activitiesWithAttendance = [];
    for (const activity of activities) {
      const attendance = await ctx.db
        .query("attendance")
        .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
        .collect();

      const presentCount = attendance.filter(a => a.status === "aanwezig").length;
      const absentCount = attendance.filter(a => a.status === "afwezig").length;
      const totalCount = presentCount + absentCount;
      const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

      activitiesWithAttendance.push({
        activityName: activity.naam,
        date: activity.datum,
        startTime: activity.startTijd,
        endTime: activity.eindTijd,
        location: activity.locatie,
        presentCount,
        absentCount,
        attendanceRate,
      });
    }

    return activitiesWithAttendance;
  },
});

export const getMembersReport = query({
  args: {
    groupId: v.optional(v.id("memberGroups")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get members (filtered by group if specified)
    let members = await ctx.db.query("members").collect();
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (group && group.memberIds) {
        members = members.filter(m => group.memberIds!.includes(m._id));
      }
    }

    // Get group information for each member
    const membersWithGroups = [];
    for (const member of members) {
      let groupName = "No Group";
      if (member.groupIds && member.groupIds.length > 0) {
        const group = await ctx.db.get(member.groupIds[0]);
        if (group) {
          groupName = group.naam;
        }
      }

      membersWithGroups.push({
        firstName: member.voornaam,
        lastName: member.naam,
        email: member.emailAdres || "",
        phone: member.gsmNummer,
        groupName,
        memberSince: member._creationTime,
        isActive: member.isActive,
      });
    }

    return membersWithGroups;
  },
});
