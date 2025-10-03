import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface DocumentBrowserProps {
  onDocumentSelect: (documentId: string) => void;
}

export function DocumentBrowser({ onDocumentSelect }: DocumentBrowserProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<Id<"folders"> | undefined>();
  const [selectedFileType, setSelectedFileType] = useState<"audio" | "word" | "excel" | "pdf" | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  const toggleStar = useMutation(api.documents.toggleStar);
  const currentUser = useQuery(api.users.getCurrentUserQuery);

  const folders = useQuery(api.folders.listFolders, { parentId: undefined });
  const documents = useQuery(api.documents.listDocuments, {
    folderId: selectedFolderId,
  });
  const searchResults = useQuery(
    api.documents.searchDocuments,
    searchTerm.trim() ? {
      searchTerm: searchTerm.trim(),
      folderId: selectedFolderId,
    } : "skip"
  );

  const displayDocuments = searchTerm.trim() ? searchResults : documents;

  // Sort documents
  const sortedDocuments = displayDocuments ? [...displayDocuments].sort((a, b) => {
    if (sortBy === "date") {
      return (b.documentDate || 0) - (a.documentDate || 0);
    } else {
      return (a.title || "").localeCompare(b.title || "");
    }
  }) : [];

  // Auto-select first folder when folders load
  useEffect(() => {
    if (folders && folders.length > 0 && !selectedFolderId) {
      setSelectedFolderId(folders[0]._id);
    }
  }, [folders, selectedFolderId]);

  const handleToggleStar = async (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation();
    try {
      await toggleStar({ documentId: documentId as Id<"documents"> });
      toast.success("Document opgeslagen status gewijzigd");
    } catch (error: any) {
      toast.error(error.message || "Fout bij wijzigen opgeslagen status");
    }
  };

  if (!folders) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📄 Documenten</h2>
          <p className="text-gray-600">Beheer en zoek je documenten</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{sortedDocuments.length}</div>
          <div className="text-sm text-gray-600">Totaal documenten</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-cyan-600">
            {sortedDocuments.filter(d => d.fileType === "pdf").length}
          </div>
          <div className="text-sm text-gray-600">PDF bestanden</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {sortedDocuments.filter(d => d.fileType === "word").length}
          </div>
          <div className="text-sm text-gray-600">Word documenten</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {sortedDocuments.filter(d => currentUser && (d.starredBy || []).includes(currentUser._id)).length}
          </div>
          <div className="text-sm text-gray-600">Opgeslagen</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Zoek documenten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <select
            value={selectedFolderId || ""}
            onChange={(e) => setSelectedFolderId(e.target.value ? e.target.value as Id<"folders"> : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Alle mappen</option>
            {folders.map(folder => (
              <option key={folder._id} value={folder._id}>{folder.name}</option>
            ))}
          </select>
          <select
            value={selectedFileType || ""}
            onChange={(e) => setSelectedFileType(e.target.value ? e.target.value as any : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">Alle types</option>
            <option value="pdf">PDF</option>
            <option value="word">Word</option>
            <option value="excel">Excel</option>
            <option value="audio">Audio</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "name")}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="date">Sorteer op datum</option>
            <option value="name">Sorteer op naam</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow">
        {sortedDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen documenten</h3>
            <p className="text-gray-500">
              {searchTerm ? "Geen documenten gevonden voor je zoekopdracht." : "Geen documenten gevonden met huidige filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Map
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDocuments.map((document) => {
                  const folder = folders.find(f => f._id === document.folderId);
                  const isStarred = currentUser && (document.starredBy || []).includes(currentUser._id);
                  
                  return (
                    <tr key={document._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                            {getFileTypeIcon(document.fileType || "")}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {document.title}
                            </div>
                            {document.description && (
                              <div className="text-sm text-gray-500">
                                {document.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {(document.fileType || "").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {folder?.name || "Geen map"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(document.documentDate || 0).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onDocumentSelect(document._id)}
                            className="text-cyan-600 hover:text-cyan-900"
                          >
                            Bekijken
                          </button>
                          <button
                            onClick={(e) => handleToggleStar(e, document._id)}
                            className={`${isStarred ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-400 hover:text-gray-600'}`}
                            title={isStarred ? "Verwijder uit opgeslagen" : "Opslaan"}
                          >
                            {isStarred ? "⭐" : "☆"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getFileTypeIcon(fileType: string) {
  switch (fileType) {
    case "pdf":
      return "📄";
    case "word":
      return "📝";
    case "excel":
      return "📊";
    case "audio":
      return "🎵";
    default:
      return "📄";
  }
}
