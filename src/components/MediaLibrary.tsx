import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface MediaLibraryProps {
  onSelectMedia?: (mediaIds: Id<"_storage">[]) => void;
  multiSelect?: boolean;
  showUpload?: boolean;
}

export function MediaLibrary({ 
  onSelectMedia, 
  multiSelect = false, 
  showUpload = true 
}: MediaLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMedia, setSelectedMedia] = useState<Id<"_storage">[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const mediaItems = useQuery(api.mediaLibrary.listMediaLibrary, {
    category: selectedCategory || undefined,
  });
  const categories = useQuery(api.mediaLibrary.getMediaCategories);
  
  const generateUploadUrl = useMutation(api.mediaLibrary.generateMediaUploadUrl);
  const addMediaToLibrary = useMutation(api.mediaLibrary.addMediaToLibrary);
  const deleteMediaItem = useMutation(api.mediaLibrary.deleteMediaItem);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      try {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        
        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }
        
        const { storageId } = await result.json();
        
        // Add to media library
        await addMediaToLibrary({
          name: file.name,
          storageId,
          mimeType: file.type,
          size: file.size,
          category: selectedCategory || "Algemeen",
        });
        
        toast.success(`${file.name} geüpload`);
      } catch (error: any) {
        toast.error(`Fout bij uploaden ${file.name}: ${error.message}`);
      }
    }
  };

  const handleMediaSelect = (mediaId: Id<"_storage">) => {
    if (multiSelect) {
      const newSelection = selectedMedia.includes(mediaId)
        ? selectedMedia.filter(id => id !== mediaId)
        : [...selectedMedia, mediaId];
      setSelectedMedia(newSelection);
      onSelectMedia?.(newSelection);
    } else {
      setSelectedMedia([mediaId]);
      onSelectMedia?.([mediaId]);
    }
  };

  const handleDeleteMedia = async (mediaId: Id<"mediaLibrary">) => {
    if (confirm("Weet je zeker dat je dit media item wilt verwijderen?")) {
      try {
        await deleteMediaItem({ mediaId });
        toast.success("Media item verwijderd");
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen media item");
      }
    }
  };

  const filteredMedia = mediaItems?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    return "📁";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Media Bibliotheek</h2>
        {showUpload && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            + Upload Media
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Zoek media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Alle categorieën</option>
          {categories?.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Media Info */}
      {selectedMedia.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
          <p className="text-sm text-purple-800">
            {selectedMedia.length} media item{selectedMedia.length > 1 ? 's' : ''} geselecteerd
          </p>
        </div>
      )}

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredMedia?.map((item) => (
          <div
            key={item._id}
            onClick={() => handleMediaSelect(item.storageId)}
            className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
              selectedMedia.includes(item.storageId)
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Media Preview */}
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {item.mimeType.startsWith("image/") ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl flex items-center justify-center h-full">
                  {getFileIcon(item.mimeType)}
                </div>
              )}
            </div>

            {/* Media Info */}
            <div className="p-2">
              <h3 className="text-sm font-medium text-gray-900 truncate" title={item.name}>
                {item.name}
              </h3>
              <p className="text-xs text-gray-500">
                {formatFileSize(item.size)}
              </p>
              {item.category && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                  {item.category}
                </span>
              )}
            </div>

            {/* Selection Indicator */}
            {selectedMedia.includes(item.storageId) && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMedia(item._id);
              }}
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center transition-opacity"
              title="Verwijder media"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {(!filteredMedia || filteredMedia.length === 0) && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory 
              ? "Try adjusting your search criteria"
              : "Upload your first media files to get started"
            }
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Media</h3>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecteer categorie</option>
                  <option value="Algemeen">Algemeen</option>
                  <option value="Afbeeldingen">Afbeeldingen</option>
                  <option value="Video's">Video's</option>
                  <option value="Audio">Audio</option>
                  <option value="Documenten">Documenten</option>
                  {categories?.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bestanden
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(e.target.files);
                      setShowUploadForm(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
