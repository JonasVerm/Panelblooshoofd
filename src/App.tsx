import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { FrontpageDashboard } from "./components/FrontpageDashboard";
import { TodoApp } from "./apps/TodoApp";
import { LedenbeheerApp } from "./apps/LedenbeheerApp";
import { DocumentsApp } from "./apps/DocumentsApp";

import { WorkshopsApp } from "./apps/WorkshopsApp";
import { PasswordsApp } from "./apps/PasswordsApp";
import { ExpensesApp } from "./apps/ExpensesApp";
import { TimeTrackingApp } from "./apps/TimeTrackingApp";
import { ManagementApp } from "./apps/ManagementApp";
import { SocialMediaApp } from "./apps/SocialMediaApp";
import { RoomReservationApp } from "./apps/RoomReservationApp";

type AppType = 
  | "dashboard"
  | "ledenbeheer" 
  | "documents" 
  | "passwords" 
  | "expenses" 
  | "time-tracking" 
  | "workshops" 
  | "management" 
  | "social-media"
  | "room-reservations"
  | "todos";

export default function App() {
  const user = useQuery(api.auth.loggedInUser);
  const [currentApp, setCurrentApp] = useState<AppType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600 font-medium">Laden...</span>
        </div>
      </div>
    );
  }

  if (user === null) {
    return <SignInForm />;
  }

  const apps = [
    { 
      id: "dashboard" as const, 
      name: "Dashboard", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v2zm0 0h18M9 11h6" />
        </svg>
      )
    },
    { 
      id: "todos" as const, 
      name: "Taken", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: "ledenbeheer" as const, 
      name: "Leden", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    { 
      id: "documents" as const, 
      name: "Documenten", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: "workshops" as const, 
      name: "Workshops", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      id: "room-reservations" as const, 
      name: "Ruimte Reserveringen", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      id: "social-media" as const, 
      name: "Social Media", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8v11a2 2 0 002 2h14a2 2 0 002-2V8H3z" />
        </svg>
      )
    },
    { 
      id: "passwords" as const, 
      name: "Wachtwoorden", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    { 
      id: "expenses" as const, 
      name: "Uitgaven", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    { 
      id: "time-tracking" as const, 
      name: "Tijdregistratie", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: "management" as const, 
      name: "Beheer", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  const renderCurrentApp = () => {
    switch (currentApp) {
      case "dashboard":
        return <FrontpageDashboard onSelectApp={setCurrentApp} user={user} />;
      case "todos":
        return <TodoApp />;
      case "ledenbeheer":
        return <LedenbeheerApp />;
      case "documents":
        return <DocumentsApp />;
      case "passwords":
        return <PasswordsApp />;
      case "expenses":
        return <ExpensesApp />;
      case "time-tracking":
        return <TimeTrackingApp />;
      case "workshops":
        return <WorkshopsApp />;
      case "room-reservations":
        return <RoomReservationApp />;
      case "social-media":
        return <SocialMediaApp />;
      case "management":
        return <ManagementApp />;
      default:
        return <FrontpageDashboard onSelectApp={setCurrentApp} user={user} />;
    }
  };

  const getCurrentAppName = () => {
    if (currentApp === "dashboard") return "Dashboard";
    return apps.find(app => app.id === currentApp)?.name || "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } flex flex-col`}>
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">
              Blooshoofd
            </h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <svg 
              className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => setCurrentApp(app.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentApp === app.id
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              title={sidebarCollapsed ? app.name : undefined}
            >
              <span className={`${currentApp === app.id ? 'text-blue-700' : 'text-gray-400'}`}>
                {app.icon}
              </span>
              {!sidebarCollapsed && (
                <span className="ml-3">{app.name}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">Beheerder</p>
                </div>
              </div>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex justify-center">
              <SignOutButton />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getCurrentAppName()}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Welkom terug, {user.name || user.email}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {renderCurrentApp()}
        </main>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
}
