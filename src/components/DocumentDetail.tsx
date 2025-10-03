import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { ShareLinkManager } from "./ShareLinkManager";

interface DocumentDetailProps {
  documentId: string;
  onBack: () => void;
}

export function DocumentDetail({ documentId, onBack }: DocumentDetailProps) {
  const document = useQuery(api.documents.getDocument, { 
    documentId: documentId as Id<"documents"> 
  });
  const fileUrl = document?.url;
  const currentUser = useQuery(api.users.getCurrentUserQuery);
  const permissions = { canViewAuditLogs: true }; // All users have full access now
  const auditLogs = useQuery(
    api.audit.getAuditLogs, 
    permissions?.canViewAuditLogs ? { limit: 10 } : "skip"
  );
  const toggleStar = useMutation(api.documents.toggleStar);

  const handleToggleStar = async () => {
    try {
      await toggleStar({ documentId: documentId as Id<"documents"> });
      toast.success("Document opgeslagen status gewijzigd");
    } catch (error: any) {
      toast.error(error.message || "Fout bij wijzigen opgeslagen status");
    }
  };

  if (!document) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderPreview = () => {
    if (!fileUrl) return null;

    switch (document.fileType) {
      case "pdf":
        return (
          <div className="h-[600px] border border-gray-300 rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
          </div>
        );
      
      case "audio":
        return (
          <div className="p-4 border border-gray-300 rounded-lg">
            <audio controls className="w-full">
              <source src={fileUrl} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      
      case "word":
      case "excel":
        return (
          <div className="p-8 border border-gray-300 rounded-lg text-center">
            <div className="mb-4">
              <div className="text-6xl mb-4">
                {document.fileType === "word" ? "📝" : "📊"}
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {document.fileType === "word" ? "Word Document" : "Excel Spreadsheet"}
              </h3>
              <p className="text-gray-600 mb-4">
                Preview not available. Download to view in Office.
              </p>
            </div>
            <a
              href={fileUrl}
              download
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </a>
          </div>
        );
      
      default:
        return (
          <div className="p-6 border border-gray-300 rounded-lg text-center">
            <p className="text-gray-600">Preview not available</p>
          </div>
        );
    }
  };

  const documentAuditLogs = auditLogs?.filter(log => 
    log.target === `document:${documentId}`
  ).slice(0, 5) || [];

  const isStarred = currentUser && (document.starredBy || []).includes(currentUser._id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            <p className="text-gray-600">{document.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleToggleStar}
            className="inline-flex items-center px-4 py-2 border-2 rounded-md transition-all duration-200"
            style={{
              borderColor: "#B0BA4C",
              backgroundColor: isStarred ? "#B0BA4C" : "white",
              color: isStarred ? "white" : "#2A3466"
            }}
          >
            <span className="mr-2 text-lg">
              {isStarred ? "⭐" : "☆"}
            </span>
            {isStarred ? "Opgeslagen" : "Opslaan"}
          </button>
          {fileUrl && (
            <a
              href={fileUrl}
              download
              className="inline-flex items-center px-4 py-2 text-white rounded-md transition-all duration-200"
              style={{ backgroundColor: "#2A3466" }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
            {renderPreview()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Info</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">File Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{document.fileType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Document Date</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(document.documentDate || 0).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(document._creationTime).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Allowed Roles</dt>
                <dd className="text-sm text-gray-900">
                  {(document.allowedRoles || []).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Starred By</dt>
                <dd className="text-sm text-gray-900">
                  {(document.starredBy || []).length} user(s)
                </dd>
              </div>
            </dl>
          </div>

          {/* Share Links */}
          <ShareLinkManager documentId={documentId} />

          {/* Activity Log */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            {documentAuditLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {documentAuditLogs.map((log) => (
                  <div key={log._id} className="text-sm">
                    <p className="font-medium text-gray-900">{log.action}</p>
                    <p className="text-gray-600">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log._creationTime).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
