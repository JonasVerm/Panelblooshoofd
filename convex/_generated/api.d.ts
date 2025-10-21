/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as announcements from "../announcements.js";
import type * as attendance from "../attendance.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as campaigns from "../campaigns.js";
import type * as debug from "../debug.js";
import type * as documents from "../documents.js";
import type * as expenses from "../expenses.js";
import type * as folders from "../folders.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as invitations from "../invitations.js";
import type * as mediaLibrary from "../mediaLibrary.js";
import type * as memberActivities from "../memberActivities.js";
import type * as memberGroups from "../memberGroups.js";
import type * as members from "../members.js";
import type * as passwords from "../passwords.js";
import type * as permissions from "../permissions.js";
import type * as reports from "../reports.js";
import type * as router from "../router.js";
import type * as shareLinks from "../shareLinks.js";
import type * as socialMedia from "../socialMedia.js";
import type * as teachers from "../teachers.js";
import type * as timeTracking from "../timeTracking.js";
import type * as todos from "../todos.js";
import type * as users from "../users.js";
import type * as workshopFormTemplates from "../workshopFormTemplates.js";
import type * as workshopForms from "../workshopForms.js";
import type * as workshops from "../workshops.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  announcements: typeof announcements;
  attendance: typeof attendance;
  audit: typeof audit;
  auth: typeof auth;
  backup: typeof backup;
  campaigns: typeof campaigns;
  debug: typeof debug;
  documents: typeof documents;
  expenses: typeof expenses;
  folders: typeof folders;
  http: typeof http;
  init: typeof init;
  invitations: typeof invitations;
  mediaLibrary: typeof mediaLibrary;
  memberActivities: typeof memberActivities;
  memberGroups: typeof memberGroups;
  members: typeof members;
  passwords: typeof passwords;
  permissions: typeof permissions;
  reports: typeof reports;
  router: typeof router;
  shareLinks: typeof shareLinks;
  socialMedia: typeof socialMedia;
  teachers: typeof teachers;
  timeTracking: typeof timeTracking;
  todos: typeof todos;
  users: typeof users;
  workshopFormTemplates: typeof workshopFormTemplates;
  workshopForms: typeof workshopForms;
  workshops: typeof workshops;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
