import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { DocumentDetail } from "./DocumentDetail";

interface DocumentBrowserProps {
  onDocumentSelect: (documentId: string) => void;
}

export function DocumentBrowser({ onDocumentSelect }: DocumentBrowserProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const currentUser = useQuery(api.users.getCurrentUserQuery);
  const folders = useQuery(api.folders.listFolders, { parentId: undefined });
  const documents = useQuery(api.documents.listDocuments, {
    folderId: selectedFolderId as Id<"folders"> | undefined,
  });
  const searchResults = useQuery(
    api.documents.searchDocuments,
    searchTerm.length > 2 ? { searchTerm, folderId: selectedFolderId as Id<"folders"> | undefined } : "skip"
  );

  const createFolder = useMutation(api.folders.createFolder);
  const deleteFolder = useMutation(api.folders.deleteFolder);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const toggleStar = useMutation(api.documents.toggleStar);

  const displayedDocuments = searchTerm.length > 2 ? searchResults : documents;

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        name: newFolderName.trim(),
        parentId: selectedFolderId as Id<"folders"> | undefined,
      });
      toast.success("Map aangemaakt");
      setNewFolderName("");
      setShowCreateFolder(false);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken map");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm("Weet je zeker dat je deze map wilt verwijderen?")) {
      try {
        await deleteFolder({ folderId: folderId as Id<"folders"> });
        toast.success("Map verwijderd");
        if (selectedFolderId === folderId) {
          setSelectedFolderId(undefined);
        }
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen map");
      }
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm("Weet je zeker dat je dit document wilt verwijderen?")) {
      try {
        await deleteDocument({ documentId: documentId as Id<"documents"> });
        toast.success("Document verwijderd");
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen document");
      }
    }
  };

  const handleToggleStar = async (documentId: string) => {
    try {
      await toggleStar({ documentId: documentId as Id<"documents"> });
    } catch (error: any) {
      toast.error(error.message || "Fout bij bijwerken favoriet");
    }
  };

  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'word':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'excel':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (selectedDocumentId) {
    return (
      <DocumentDetail
        documentId={selectedDocumentId}
        onBack={() => setSelectedDocumentId(null)}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Laden...</h3>
          <p className="text-gray-500">Gebruikersgegevens worden geladen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar with folder tree */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Mappen</h3>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="p-1 text-blue-600 hover:text-blue-800 rounded"
              title="Nieuwe map"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {showCreateFolder && (
            <form onSubmit={handleCreateFolder} className="mb-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Map naam..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex space-x-1 mt-2">
                <button
                  type="submit"
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Maken
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName("");
                  }}
                  className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Annuleren
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedFolderId(undefined)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                !selectedFolderId ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                <span>Alle Documenten</span>
              </div>
            </button>
            
            {folders?.map((folder) => (
              <div key={folder._id} className="space-y-1">
                <div className="flex items-center justify-between group">
                  <button
                    onClick={() => setSelectedFolderId(folder._id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedFolderId === folder._id ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                      <span className="truncate">{folder.name}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-800 rounded transition-opacity"
                    title="Map verwijderen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header with search and controls */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedFolderId 
                ? folders?.find(f => f._id === selectedFolderId)?.name || "Map Documenten"
                : "Alle Documenten"
              }
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Zoek documenten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Documents grid/list */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayedDocuments && displayedDocuments.length > 0 ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {displayedDocuments.map((document) => (
                <div
                  key={document._id}
                  className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                    viewMode === "list" ? "flex items-center p-4" : "p-4"
                  }`}
                  onClick={() => setSelectedDocumentId(document._id)}
                >
                  {viewMode === "grid" ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(document.fileType || 'other')}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(document._id);
                          }}
                          className={`p-1 rounded ${
                            document.starredBy?.includes(currentUser._id)
                              ? "text-yellow-500"
                              : "text-gray-400 hover:text-yellow-500"
                          }`}
                        >
                          <svg className="w-5 h-5" fill={document.starredBy?.includes(currentUser._id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                        {document.title || document.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        {formatFileSize(document.size)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(document.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 mr-4">
                        {getFileIcon(document.fileType || 'other')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {document.title || document.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(document.size)} • {new Date(document.createdAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(document._id);
                          }}
                          className={`p-1 rounded ${
                            document.starredBy?.includes(currentUser._id)
                              ? "text-yellow-500"
                              : "text-gray-400 hover:text-yellow-500"
                          }`}
                        >
                          <svg className="w-4 h-4" fill={document.starredBy?.includes(currentUser._id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(document._id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm.length > 2 ? "Geen documenten gevonden" : "Geen documenten"}
              </h3>
              <p className="text-gray-500">
                {searchTerm.length > 2 
                  ? `Geen documenten gevonden voor "${searchTerm}"`
                  : "Upload je eerste document om te beginnen"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
