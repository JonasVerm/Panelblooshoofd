import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import JSZip from "jszip";

export function BackupManager() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const backupData = useQuery(api.backup.getBackupData);
  const logBackupCreation = useMutation(api.backup.logBackupCreation);

  const createBackup = async () => {
    if (!backupData) {
      toast.error("Backup data not available");
      return;
    }

    setIsCreatingBackup(true);
    toast.info("Backup wordt aangemaakt...");

    try {
      const zip = new JSZip();
      
      // Create metadata file
      const metadata = {
        createdAt: new Date().toISOString(),
        totalDocuments: backupData.length,
        folders: [...new Set(backupData.map((doc: any) => doc.folderPath).filter(Boolean))],
      };
      
      zip.file("backup-metadata.json", JSON.stringify(metadata, null, 2));

      // Create documents index
      const documentsIndex = backupData.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        fileType: doc.fileType,
        documentDate: new Date(doc.documentDate || 0).toISOString(),
        creationTime: new Date(doc.creationTime).toISOString(),
        folderPath: doc.folderPath,
        fileName: `${sanitizeFileName(doc.title || "document")}.${getFileExtension(doc.fileType || "")}`,
        allowedRoles: doc.allowedRoles,
        allowedUserIds: doc.allowedUserIds,
      }));
      
      zip.file("documents-index.json", JSON.stringify(documentsIndex, null, 2));

      // Download and add files to zip
      let processedCount = 0;
      for (const doc of backupData) {
        if (doc.fileUrl) {
          try {
            const response = await fetch(doc.fileUrl);
            if (response.ok) {
              const blob = await response.blob();
              
              // Create folder structure in zip
              const folderPath = doc.folderPath || "Uncategorized";
              const fileName = `${sanitizeFileName(doc.title || "document")}.${getFileExtension(doc.fileType || "")}`;
              const fullPath = `documents/${folderPath}/${fileName}`;
              
              zip.file(fullPath, blob);
              processedCount++;
              
              // Update progress
              if (processedCount % 5 === 0) {
                toast.info(`Verwerkt: ${processedCount}/${backupData.length} bestanden`);
              }
            }
          } catch (error) {
            console.error(`Failed to download file for document ${doc.title}:`, error);
          }
        }
      }

      // Generate and download zip
      toast.info("Backup wordt gegenereerd...");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `document-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log the backup creation
      await logBackupCreation({ documentCount: backupData.length });
      
      toast.success(`Backup succesvol aangemaakt! ${processedCount} bestanden gedownload.`);
    } catch (error) {
      console.error("Backup creation failed:", error);
      toast.error("Fout bij aanmaken backup");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[<>:"/\\|?*]/g, "_").trim();
  };

  const getFileExtension = (fileType: string): string => {
    switch (fileType) {
      case "pdf": return "pdf";
      case "word": return "docx";
      case "excel": return "xlsx";
      case "audio": return "mp3";
      default: return "pdf";
    }
  };

  if (!backupData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Backup Beheer</h3>
        <p className="text-sm text-gray-600">
          Maak een volledige backup van alle documenten georganiseerd in hun mappenstructuur.
        </p>
      </div>

      {/* Backup Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Totaal Documenten</p>
              <p className="text-lg font-semibold text-blue-600">{backupData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Unieke Mappen</p>
              <p className="text-lg font-semibold text-green-600">
                {new Set(backupData.map((doc: any) => doc.folderPath).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Volledige Backup Downloaden</h4>
            <p className="text-sm text-gray-600 mt-1">
              Download alle documenten georganiseerd in hun mappenstructuur als ZIP-bestand.
              Inclusief metadata en documentenindex.
            </p>
          </div>
          <button
            onClick={createBackup}
            disabled={isCreatingBackup || backupData.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isCreatingBackup ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Backup Aanmaken...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Backup Downloaden</span>
              </>
            )}
          </button>
        </div>

        {backupData.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Geen documenten beschikbaar voor backup.
            </p>
          </div>
        )}
      </div>

      {/* Backup Contents Preview */}
      {backupData.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Backup Inhoud Preview</h4>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* File Types Breakdown */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Bestandstypes:</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    backupData.reduce((acc: any, doc: any) => {
                      const fileType = doc.fileType || "unknown";
                      acc[fileType] = (acc[fileType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {String(type).toUpperCase()}: {String(count)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Folder Structure Preview */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Mappenstructuur:</h5>
                <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  <div>📁 documents/</div>
                  {[...new Set(backupData.map((doc: any) => doc.folderPath).filter(Boolean))].map((path: any) => (
                    <div key={String(path)} className="ml-4">
                      📁 {String(path)}/
                    </div>
                  ))}
                  {backupData.some((doc: any) => !doc.folderPath) && (
                    <div className="ml-4">📁 Uncategorized/</div>
                  )}
                  <div className="ml-2 mt-2 text-gray-500">
                    📄 backup-metadata.json<br/>
                    📄 documents-index.json
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
