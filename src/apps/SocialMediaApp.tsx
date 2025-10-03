import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { KanbanBoard } from "../components/KanbanBoard";
import { ContentCalendar } from "../components/ContentCalendar";
import { IdeaBox } from "../components/IdeaBox";
import { CampaignManager } from "../components/CampaignManager";
import { MediaLibrary } from "../components/MediaLibrary";
import { PostEditor } from "../components/PostEditor";

type ViewMode = "kanban" | "calendar" | "ideas" | "campaigns" | "media" | "editor";

export function SocialMediaApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  const permissions = useQuery(api.permissions.getUserPermissions, {});

  const views = [
    { 
      id: "kanban" as const, 
      label: "Kanban Board", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      show: true
    },
    { 
      id: "calendar" as const, 
      label: "Content Calendar", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      show: true
    },
    { 
      id: "ideas" as const, 
      label: "Ideas", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      show: true
    },
    { 
      id: "campaigns" as const, 
      label: "Campaigns", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      show: true
    },
    { 
      id: "media" as const, 
      label: "Media Library", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      show: true
    },
  ];

  const visibleViews = views.filter(view => view.show);

  const handleEditPost = (postId: string) => {
    setSelectedPostId(postId);
    setViewMode("editor");
  };

  const handleCloseEditor = () => {
    setSelectedPostId(null);
    setViewMode("kanban");
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {visibleViews.map((view) => (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  viewMode === view.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className={viewMode === view.id ? "text-blue-600" : "text-gray-400"}>
                  {view.icon}
                </span>
                <span>{view.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "kanban" && (
            <KanbanBoard onEditPost={handleEditPost} />
          )}
          {viewMode === "calendar" && (
            <ContentCalendar onEditPost={handleEditPost} />
          )}
          {viewMode === "ideas" && (
            <IdeaBox />
          )}
          {viewMode === "campaigns" && (
            <CampaignManager />
          )}
          {viewMode === "media" && (
            <MediaLibrary />
          )}
          {viewMode === "editor" && selectedPostId && (
            <PostEditor 
              postId={selectedPostId} 
              onClose={handleCloseEditor}
            />
          )}
        </div>
      </div>
    </div>
  );
}
