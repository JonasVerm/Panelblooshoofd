import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Member Groups
  memberGroups: defineTable({
    naam: v.string(),
    beschrijving: v.optional(v.string()),
    kleur: v.string(),
    memberIds: v.optional(v.array(v.id("members"))),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_active", ["isActive"]),

  // Members
  members: defineTable({
    naam: v.string(),
    voornaam: v.string(),
    gsmNummer: v.optional(v.string()),
    emailAdres: v.optional(v.string()),
    naamOuders: v.optional(v.string()),
    emailOuders: v.optional(v.string()),
    gsmOuders: v.optional(v.string()),
    adres: v.optional(v.string()),
    rijksregisternummer: v.optional(v.string()),
    opmerkingen: v.optional(v.string()),
    groupIds: v.optional(v.array(v.id("memberGroups"))),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_active", ["isActive"])
    .index("by_group", ["groupIds"])
    .searchIndex("search_members", {
      searchField: "naam",
      filterFields: ["isActive"],
    }),

  // Activities
  activities: defineTable({
    naam: v.string(),
    beschrijving: v.optional(v.string()),
    datum: v.number(),
    startTijd: v.string(),
    eindTijd: v.string(),
    locatie: v.optional(v.string()),
    kleur: v.optional(v.string()),
    type: v.union(v.literal("eenmalig"), v.literal("herhalend")),
    herhalingType: v.optional(v.union(v.literal("wekelijks"), v.literal("tweewekelijks"), v.literal("maandelijks"))),
    herhalingEinde: v.optional(v.number()),
    parentActivityId: v.optional(v.id("activities")),
    targetGroupIds: v.optional(v.array(v.id("memberGroups"))),
    targetMemberIds: v.optional(v.array(v.id("members"))),
    createdBy: v.optional(v.id("users")),
    isActive: v.boolean(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_date", ["datum"])
    .index("by_active", ["isActive"])
    .index("by_parent", ["parentActivityId"]),

  // Attendance
  attendance: defineTable({
    activityId: v.id("activities"),
    memberId: v.id("members"),
    status: v.union(v.literal("aanwezig"), v.literal("afwezig")),
    notitie: v.optional(v.string()),
    markedBy: v.optional(v.id("users")),
    markedAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_activity", ["activityId"])
    .index("by_member", ["memberId"])
    .index("by_activity_member", ["activityId", "memberId"]),

  // Announcements
  announcements: defineTable({
    title: v.string(),
    content: v.string(),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent")),
    targetGroups: v.optional(v.array(v.id("memberGroups"))),
    targetMembers: v.optional(v.array(v.id("members"))),
    targetRoles: v.optional(v.array(v.string())),
    targetUsers: v.optional(v.array(v.id("users"))),
    targetAudience: v.optional(v.string()),
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"])
    .index("by_expires", ["expiresAt"])
    .searchIndex("search_announcements", {
      searchField: "title",
      filterFields: ["isActive"],
    }),

  // Folders
  folders: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("folders")),
    path: v.optional(v.string()),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    allowedRoles: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_parent", ["parentId"])
    .index("by_active", ["isActive"])
    .index("by_path", ["path"]),

  // Documents
  documents: defineTable({
    name: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    storageId: v.id("_storage"),
    fileId: v.optional(v.id("_storage")),
    mimeType: v.string(),
    fileType: v.optional(v.string()),
    size: v.number(),
    documentDate: v.optional(v.number()),
    allowedRoles: v.optional(v.array(v.string())),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    starredBy: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_folder", ["folderId"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"])
    .searchIndex("search_documents", {
      searchField: "name",
      filterFields: ["isActive", "folderId"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isActive", "fileType"],
    }),

  // Share Links
  shareLinks: defineTable({
    documentId: v.id("documents"),
    token: v.string(),
    expiresAt: v.optional(v.number()),
    viewOnly: v.optional(v.boolean()),
    maxAccess: v.optional(v.number()),
    accessCount: v.optional(v.number()),
    requiresPassword: v.optional(v.boolean()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
  }).index("by_token", ["token"])
    .index("by_document", ["documentId"])
    .index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"]),

  // Passwords
  passwords: defineTable({
    title: v.string(),
    username: v.optional(v.string()),
    password: v.string(),
    website: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sharedWith: v.optional(v.array(v.id("users"))),
    allowedUserIds: v.optional(v.array(v.id("users"))),
    allowedRoles: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    lastModified: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"])
    .index("by_category", ["category"])
    .searchIndex("search_passwords", {
      searchField: "title",
      filterFields: ["isActive", "createdBy"],
    }),

  // Expenses
  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    vendor: v.optional(v.string()),
    category: v.optional(v.string()),
    date: v.number(),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    receipt: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"])
    .index("by_category", ["category"])
    .index("by_date", ["date"])
    .index("by_status", ["status"]),

  // Time Tracking
  timeEntries: defineTable({
    description: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    project: v.optional(v.string()),
    projectName: v.optional(v.string()),
    category: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    date: v.optional(v.string()),
    isRunning: v.optional(v.boolean()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"])
    .index("by_project", ["project"])
    .index("by_start_time", ["startTime"])
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Projects
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),

  // Workshops
  workshops: defineTable({
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    datum: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    startUur: v.optional(v.string()),
    eindUur: v.optional(v.string()),
    location: v.optional(v.string()),
    maxParticipants: v.optional(v.number()),
    price: v.optional(v.number()),
    type: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    teacherId: v.optional(v.id("teachers")),
    naamSchool: v.optional(v.string()),
    naamLeerkracht: v.optional(v.string()),
    factuurStatus: v.optional(v.union(v.literal("niet_verzonden"), v.literal("verzonden"), v.literal("betaald"))),
    extra: v.optional(v.string()),
    opmerking: v.optional(v.string()),
    customFields: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_date", ["date"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"])
    .index("by_teacher", ["teacherId"]),

  // Workshop Form Templates
  workshopFormTemplates: defineTable({
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
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"])
    .index("by_default", ["isDefault"]),

  workshopForms: defineTable({
    workshopId: v.id("workshops"),
    fields: v.array(v.object({
      id: v.string(),
      type: v.union(v.literal("text"), v.literal("email"), v.literal("tel"), v.literal("textarea"), v.literal("select"), v.literal("checkbox"), v.literal("radio")),
      label: v.string(),
      required: v.boolean(),
      options: v.optional(v.array(v.string())),
    })),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_workshop", ["workshopId"])
    .index("by_active", ["isActive"]),

  // Workshop Registrations
  workshopRegistrations: defineTable({
    workshopId: v.id("workshops"),
    participantName: v.string(),
    participantEmail: v.string(),
    participantPhone: v.optional(v.string()),
    formData: v.object({}),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("refunded")),
    registrationDate: v.number(),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_workshop", ["workshopId"])
    .index("by_status", ["status"])
    .index("by_email", ["participantEmail"])
    .index("by_active", ["isActive"]),

  // Teachers
  teachers: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),

    availability: v.optional(v.array(v.object({
      day: v.union(v.literal("monday"), v.literal("tuesday"), v.literal("wednesday"), v.literal("thursday"), v.literal("friday"), v.literal("saturday"), v.literal("sunday")),
      startTime: v.string(),
      endTime: v.string(),
    }))),
    userId: v.optional(v.id("users")),
    calendarToken: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_active", ["isActive"])
    .index("by_email", ["email"])
    .index("by_user", ["userId"])
    .index("by_calendar_token", ["calendarToken"])
    .searchIndex("search_teachers", {
      searchField: "name",
      filterFields: ["isActive"],
    }),

  // Teacher Assignments
  teacherAssignments: defineTable({
    teacherId: v.id("teachers"),
    workshopId: v.id("workshops"),
    role: v.union(v.literal("primary"), v.literal("assistant")),
    fee: v.optional(v.number()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_teacher", ["teacherId"])
    .index("by_workshop", ["workshopId"])
    .index("by_active", ["isActive"]),

  // Invitations
  invitations: defineTable({
    email: v.string(),
    role: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    isUsed: v.boolean(),
    used: v.optional(v.boolean()),
    invitedBy: v.optional(v.id("users")),
    usedBy: v.optional(v.id("users")),
    permissions: v.optional(v.object({})),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
  }).index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_used", ["isUsed"]),

  // Audit Log
  auditLog: defineTable({
    userId: v.id("users"),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.union(v.object({}), v.string())),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_resource", ["resource"]),

  // Reports
  reports: defineTable({
    name: v.string(),
    type: v.string(),
    parameters: v.object({}),
    data: v.object({}),
    generatedBy: v.id("users"),
    generatedAt: v.number(),
    isActive: v.boolean(),
  }).index("by_type", ["type"])
    .index("by_generated_by", ["generatedBy"])
    .index("by_active", ["isActive"]),

  // Backup
  backups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    size: v.number(),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
  }).index("by_created_by", ["createdBy"])
    .index("by_created_at", ["createdAt"]),

  // Todos
  todos: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    createdBy: v.id("users"),
    isCompleted: v.boolean(),
    isActive: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"])
    .index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"])
    .index("by_completed", ["isCompleted"])
    .index("by_due_date", ["dueDate"]),

  // Expense Reports
  expenseReports: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    amount: v.number(),
    category: v.string(),
    date: v.number(),
    currency: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("processed")),
    receiptId: v.optional(v.id("_storage")),
    submittedBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_submitted_by", ["submittedBy"])
    .searchIndex("search_expenses", {
      searchField: "title",
      filterFields: ["isActive", "status"],
    }),

  // Audit Logs
  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    actor: v.id("users"),
    action: v.string(),
    resource: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    target: v.optional(v.string()),
    details: v.optional(v.union(v.object({}), v.string())),
    timestamp: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_actor", ["actor"])
    .index("by_timestamp", ["timestamp"])
    .index("by_resource", ["resource"]),

  // Workshop Form Configs
  workshopFormConfigs: defineTable({
    workshopId: v.optional(v.id("workshops")),
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
    updatedBy: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_workshop", ["workshopId"])
    .index("by_active", ["isActive"]),

  // Social Media Tables
  campaigns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    color: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),

  socialMediaPosts: defineTable({
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
    createdBy: v.id("users"),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_campaign", ["campaignId"])
    .index("by_assigned", ["assignedTo"])
    .index("by_active", ["isActive"])
    .index("by_scheduled", ["scheduledDate"]),

  postComments: defineTable({
    postId: v.id("socialMediaPosts"),
    content: v.string(),
    type: v.optional(v.union(v.literal("comment"), v.literal("feedback"), v.literal("approval"))),
    authorId: v.id("users"),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_active", ["isActive"]),

  mediaLibrary: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    uploadedBy: v.id("users"),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_category", ["category"])
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_active", ["isActive"])
    .searchIndex("search_media", {
      searchField: "name",
      filterFields: ["isActive", "category"],
    }),

  // Room Reservation System
  rooms: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    capacity: v.optional(v.number()),
    equipment: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),

  // Room Availability Schedule - defines when rooms are available
  roomAvailability: defineTable({
    roomId: v.id("rooms"),
    dayOfWeek: v.union(
      v.literal("monday"),
      v.literal("tuesday"), 
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday")
    ),
    startTime: v.string(), // e.g., "09:00"
    endTime: v.string(),   // e.g., "22:00"
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_room", ["roomId"])
    .index("by_room_day", ["roomId", "dayOfWeek"])
    .index("by_active", ["isActive"]),

  roomReservations: defineTable({
    roomId: v.id("rooms"),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    purpose: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("confirmed"), v.literal("pending"), v.literal("cancelled")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_room", ["roomId"])
    .index("by_date", ["date"])
    .index("by_room_date", ["roomId", "date"])
    .index("by_active", ["isActive"]),

  roomUnavailability: defineTable({
    roomId: v.id("rooms"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    reason: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_room", ["roomId"])
    .index("by_date", ["date"])
    .index("by_room_date", ["roomId", "date"])
    .index("by_active", ["isActive"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
