import { useState } from "react";
import { DocumentBrowser } from "../components/DocumentBrowser";
import { DocumentUpload } from "../components/DocumentUpload";
import { ShareLinksOverview } from "../components/ShareLinksOverview";

type ViewMode = "browser" | "upload" | "shares";

export function DocumentsApp() {
  const [viewMode, setViewMode] = useState<ViewMode>("browser");

  const views = [
    { 
      id: "browser" as const, 
      label: "Documenten", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z" />
        </svg>
      )
    },
    { 
      id: "upload" as const, 
      label: "Uploaden", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    { 
      id: "shares" as const, 
      label: "Gedeelde Links", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
  ];

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {views.map((view) => (
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
          {viewMode === "browser" && <DocumentBrowser onDocumentSelect={() => {}} />}
          {viewMode === "upload" && <DocumentUpload />}
          {viewMode === "shares" && <ShareLinksOverview />}
        </div>
      </div>
    </div>
  );
}
