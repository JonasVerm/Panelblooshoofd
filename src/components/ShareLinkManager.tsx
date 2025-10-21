import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ShareLinkManagerProps {
  documentId: string;
}

export function ShareLinkManager({ documentId }: ShareLinkManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number | undefined>(7);
  const [viewOnly, setViewOnly] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUserQuery);
  const permissions = useQuery(api.permissions.getUserPermissions, {});
  const document = useQuery(api.documents.getDocument, {
    documentId: documentId as Id<"documents">
  });

  // Only fetch share links if user has permission (can access the document)
  const canManageShareLinks = currentUser && document && permissions &&
    (permissions.canAccessManagement || 
     document.createdBy === currentUser._id ||
     document.allowedUserIds?.includes(currentUser._id) ||
     document.allowedRoles?.includes("admin") && permissions.canAccessManagement);

  const shareLinks = useQuery(
    api.shareLinks.getShareLinks,
    canManageShareLinks ? { documentId: documentId as Id<"documents"> } : "skip"
  );

  const generateShareLink = useMutation(api.shareLinks.generateShareLink);
  const deleteShareLink = useMutation(api.shareLinks.deleteShareLink);

  // Don't render if user doesn't have permission
  if (!canManageShareLinks) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen toegang</h3>
          <p className="text-gray-500">Je hebt geen toegang tot deze functie.</p>
        </div>
      </div>
    );
  }

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const expiresAt = expirationDays 
        ? Date.now() + (expirationDays * 24 * 60 * 60 * 1000)
        : undefined;

      const result = await generateShareLink({
        documentId: documentId as Id<"documents">,
        expiresAt,
        viewOnly,
      });

      const shareUrl = `${window.location.origin}/share/${result}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Deel link aangemaakt en gekopieerd naar klembord!");
      
      setShowCreateForm(false);
      setExpirationDays(7);
      setViewOnly(true);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken deel link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteShareLink = async (shareLinkId: string) => {
    try {
      await deleteShareLink({ shareLinkId: shareLinkId as Id<"shareLinks"> });
      toast.success("Deel link verwijderd");
    } catch (error: any) {
      toast.error(error.message || "Fout bij verwijderen deel link");
    }
  };

  const copyToClipboard = async (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link gekopieerd naar klembord!");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Deel Links</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? "Annuleren" : "Nieuwe Link"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateShareLink} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vervaldatum
              </label>
              <select
                value={expirationDays || ""}
                onChange={(e) => setExpirationDays(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Geen vervaldatum</option>
                <option value="1">1 dag</option>
                <option value="7">7 dagen</option>
                <option value="30">30 dagen</option>
                <option value="90">90 dagen</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={viewOnly}
                  onChange={(e) => setViewOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Alleen bekijken (geen download)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Aanmaken..." : "Deel Link Aanmaken"}
            </button>
          </div>
        </form>
      )}

      {shareLinks && shareLinks.length > 0 ? (
        <div className="space-y-3">
          {shareLinks.map((link: any) => (
            <div key={link._id} className="p-4 border border-gray-200 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      link.viewOnly ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                    }`}>
                      {link.viewOnly ? "Alleen bekijken" : "Download toegestaan"}
                    </span>
                    {link.expiresAt && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        link.expiresAt < Date.now() ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {link.expiresAt < Date.now() 
                          ? "Verlopen" 
                          : `Verloopt ${new Date(link.expiresAt).toLocaleDateString('nl-NL')}`
                        }
                      </span>
                    )}
                  </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(link.token)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Kopiëren
                  </button>
                  <button
                    onClick={() => handleDeleteShareLink(link._id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Geen deel links aangemaakt</p>
        </div>
      )}
    </div>
  );
}
