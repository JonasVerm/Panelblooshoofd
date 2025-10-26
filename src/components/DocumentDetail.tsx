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
        return (
          <div className="space-y-4">
            <div className="p-8 border border-gray-300 rounded-lg bg-gray-50 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Word Document</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Preview niet beschikbaar voor Word documenten.<br />
                    Download het bestand om het te bekijken.
                  </p>
                  <a
                    href={fileUrl}
                    download
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Word Document
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "excel":
        return (
          <div className="space-y-4">
            <div className="p-8 border border-gray-300 rounded-lg bg-gray-50 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Excel Spreadsheet</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Preview niet beschikbaar voor Excel bestanden.<br />
                    Download het bestand om het te bekijken.
                  </p>
                  <a
                    href={fileUrl}
                    download
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Excel Bestand
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <img
              src={fileUrl}
              alt={document.title || document.name}
              className="w-full h-auto max-h-[600px] object-contain"
            />
          </div>
        );

      case "video":
        return (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <video
              controls
              className="w-full h-auto max-h-[600px]"
              preload="metadata"
            >
              <source src={fileUrl} />
              Your browser does not support the video element.
            </video>
          </div>
        );

      case "text":
        return (
          <div className="p-8 border border-gray-300 rounded-lg bg-gray-50 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Tekstbestand</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Download het bestand om de inhoud te bekijken.
                </p>
                <a
                  href={fileUrl}
                  download
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Bestand
                </a>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-8 border border-gray-300 rounded-lg bg-gray-50 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Onbekend Bestandstype</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Preview niet beschikbaar voor dit bestandstype.
                </p>
                <a
                  href={fileUrl}
                  download
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Bestand
                </a>
              </div>
            </div>
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
