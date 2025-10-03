import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Simplified permissions - all authenticated users have full access
export const getUserPermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Return all permissions as true for authenticated users
    return {
      canAccessDocuments: true,
      canAccessPasswords: true,
      canAccessManagement: true,
      canAccessExpenses: true,
      canAccessLedenbeheer: true,
      canAccessAccounting: true,
      canAccessAnnouncements: true,
      canAccessPlaylists: true,
      canAccessTimeTracking: true,
      canAccessWorkshops: true,
      canCreateDocuments: true,
      canEditAllDocuments: true,
      canDeleteAllDocuments: true,
      canShareDocuments: true,
      canCreatePasswords: true,
      canEditAllPasswords: true,
      canDeleteAllPasswords: true,
      canViewAllPasswords: true,
      canCreateExpenses: true,
      canViewAllExpenses: true,
      canApproveExpenses: true,
      canExportExpenses: true,
      canCreateTimeEntries: true,
      canViewAllTimeEntries: true,
      canManageUsers: true,
      canViewAuditLogs: true,
      canExportData: true,
      canViewAllWorkshops: true,
      canManageAllWorkshops: true,
    };
  },
});
