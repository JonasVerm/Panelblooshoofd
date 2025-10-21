import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function ShareLinksOverview() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number | undefined>(7);
  const [viewOnly, setViewOnly] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUserQuery);
  const shareLinks = useQuery(api.shareLinks.getAllShareLinks);
  const documents = useQuery(api.documents.listDocuments, {});
  
  const generateShareLink = useMutation(api.shareLinks.generateShareLink);
  const deleteShareLink = useMutation(api.shareLinks.deleteShareLink);

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDocumentId) {
      toast.error("Selecteer eerst een document");
      return;
    }

    setIsCreating(true);

    try {
      const expiresAt = expirationDays 
        ? Date.now() + (expirationDays * 24 * 60 * 60 * 1000)
        : undefined;

      const result = await generateShareLink({
        documentId: selectedDocumentId as Id<"documents">,
        expiresAt,
        viewOnly,
      });

      const shareUrl = `${window.location.origin}/share/${result}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Deel link aangemaakt en gekopieerd naar klembord!");
      
      setShowCreateForm(false);
      setSelectedDocumentId("");
      setExpirationDays(7);
      setViewOnly(true);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken deel link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteShareLink = async (shareLinkId: string) => {
    if (!confirm("Weet je zeker dat je deze deel link wilt verwijderen?")) {
      return;
    }

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

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Laden...</h3>
          <p className="text-gray-500">Gebruikersgegevens worden geladen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Gedeelde Links</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showCreateForm ? "Annuleren" : "Nieuwe Link"}
            </button>
          </div>

          <p className="text-gray-600">
            Beheer alle gedeelde links voor je documenten. Maak nieuwe links aan of verwijder bestaande links.
          </p>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nieuwe Deel Link Maken</h2>
            
            <form onSubmit={handleCreateShareLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document *
                </label>
                <select
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecteer een document...</option>
                  {documents?.map(document => (
                    <option key={document._id} value={document._id}>
                      {document.title || document.name}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Aanmaken..." : "Deel Link Aanmaken"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Share Links List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {shareLinks && shareLinks.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {shareLinks.map((link) => (
                <div key={link._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {link.document?.title || link.document?.name || "Onbekend Document"}
                      </h3>
                      
                      <div className="flex items-center space-x-4 mb-3">
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
                        
                        <span className="text-xs text-gray-500">
                          {link.accessCount || 0} keer gebruikt
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">
                        Aangemaakt op {new Date(link.createdAt).toLocaleDateString('nl-NL')}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
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
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen gedeelde links</h3>
              <p className="text-gray-500 mb-4">
                Je hebt nog geen deel links aangemaakt. Maak je eerste link aan om documenten te delen.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Eerste Link Maken
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
