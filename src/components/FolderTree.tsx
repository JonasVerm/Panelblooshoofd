import { Id } from "../../convex/_generated/dataModel";

interface FolderWithChildren {
  _id: Id<"folders">;
  name: string;
  parentId?: Id<"folders">;
  _creationTime: number;
  children: FolderWithChildren[];
}

interface FolderTreeProps {
  folders: any[];
  onDelete: (folderId: Id<"folders">) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
}

export function FolderTree({ folders, onDelete, expandedFolders, toggleFolder }: FolderTreeProps) {
  // Build folder tree
  const buildFolderTree = (folders: any[], parentId?: Id<"folders">): FolderWithChildren[] => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .map(folder => ({
        ...folder,
        children: buildFolderTree(folders, folder._id),
      }));
  };

  const folderTree = buildFolderTree(folders);

  return (
    <div className="space-y-2">
      {folderTree.map(folder => (
        <FolderItem 
          key={folder._id}
          folder={folder} 
          onDelete={onDelete} 
          expandedFolders={expandedFolders} 
          toggleFolder={toggleFolder} 
          level={0}
        />
      ))}
    </div>
  );
}

function FolderItem({ folder, onDelete, expandedFolders, toggleFolder, level }: {
  folder: FolderWithChildren;
  onDelete: (folderId: Id<"folders">) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  level: number;
}) {
  const hasChildren = folder.children && folder.children.length > 0;
  const isExpanded = expandedFolders.has(folder._id);

  return (
    <div>
      <div 
        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center space-x-3 flex-1">
          {hasChildren && (
            <button
              onClick={() => toggleFolder(folder._id)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          <span>{hasChildren ? (isExpanded ? "📂" : "📁") : "📁"}</span>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{folder.name}</p>
            <p className="text-xs text-gray-400">
              Aangemaakt {new Date(folder._creationTime).toLocaleDateString()}
              {hasChildren && ` • ${folder.children.length} submappen`}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDelete(folder._id)}
          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm"
        >
          Verwijderen
        </button>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {folder.children.map(child => (
            <FolderItem 
              key={child._id}
              folder={child} 
              onDelete={onDelete} 
              expandedFolders={expandedFolders} 
              toggleFolder={toggleFolder} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
