import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AnnouncementsWall } from "./AnnouncementsWall";

type AppType = 
  | "dashboard"
  | "ledenbeheer" 
  | "documents" 
  | "passwords" 
  | "expenses" 
  | "time-tracking" 
  | "workshops" 
  | "announcements" 
  | "management" 
  | "social-media"
  | "todos";

interface FrontpageDashboardProps {
  onSelectApp: (app: AppType) => void;
  user: any;
}

export function FrontpageDashboard({ onSelectApp, user }: FrontpageDashboardProps) {
  const apps = [
    {
      id: "todos",
      name: "Tasks",
      description: "Manage your tasks and to-dos",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600"
    },
    {
      id: "ledenbeheer",
      name: "Members",
      description: "Manage member information and groups",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600"
    },
    {
      id: "documents",
      name: "Documents",
      description: "Store and organize your files",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600"
    },
    {
      id: "announcements",
      name: "Announcements",
      description: "Create and manage announcements",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600"
    },
    {
      id: "workshops",
      name: "Workshops",
      description: "Manage workshops and events",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600"
    },
    {
      id: "social-media",
      name: "Social Media",
      description: "Manage social media content and campaigns",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8v11a2 2 0 002 2h14a2 2 0 002-2V8H3z" />
        </svg>
      ),
      color: "bg-pink-500",
      hoverColor: "hover:bg-pink-600"
    },
    {
      id: "passwords",
      name: "Passwords",
      description: "Secure password management",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600"
    },
    {
      id: "expenses",
      name: "Expenses",
      description: "Track and manage expenses",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: "bg-yellow-500",
      hoverColor: "hover:bg-yellow-600"
    },
    {
      id: "time-tracking",
      name: "Time Tracking",
      description: "Track time and productivity",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-teal-500",
      hoverColor: "hover:bg-teal-600"
    },
    {
      id: "management",
      name: "Management",
      description: "System administration and settings",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "bg-gray-500",
      hoverColor: "hover:bg-gray-600"
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name || user.email}!
        </h1>
        <p className="text-gray-600">
          Choose an application to get started
        </p>
      </div>

      {/* Announcements Wall - Now at the top */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <AnnouncementsWall />
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => onSelectApp(app.id as AppType)}
            className={`${app.color} ${app.hoverColor} text-white rounded-lg p-6 text-left transition-all duration-200 transform hover:scale-105 hover:shadow-lg group`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/90 group-hover:text-white transition-colors">
                {app.icon}
              </div>
              <svg 
                className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">{app.name}</h3>
            <p className="text-white/80 text-sm">{app.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
