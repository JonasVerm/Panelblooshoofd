import { useState } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";

// Import all apps
import { LedenbeheerApp } from "./apps/LedenbeheerApp";
import { DocumentsApp } from "./apps/DocumentsApp";
import { PasswordsApp } from "./apps/PasswordsApp";
import { ExpensesApp } from "./apps/ExpensesApp";
import { TimeTrackingApp } from "./apps/TimeTrackingApp";
import { WorkshopsApp } from "./apps/WorkshopsApp";
import { SocialMediaApp } from "./apps/SocialMediaApp";
import { RoomReservationApp } from "./apps/RoomReservationApp";
import { ManagementApp } from "./apps/ManagementApp";
import { TodoApp } from "./apps/TodoApp";
import { ContactsApp } from "./apps/ContactsApp";
import { FrontpageDashboard } from "./components/FrontpageDashboard";

type AppType = 
  | "dashboard"
  | "ledenbeheer" 
  | "documents" 
  | "passwords" 
  | "expenses" 
  | "time-tracking" 
  | "workshops" 
  | "social-media" 
  | "room-reservation" 
  | "management"
  | "todos"
  | "contacts";

function App() {
  const [currentApp, setCurrentApp] = useState<AppType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = useQuery(api.auth.loggedInUser);

  const handlePathNavigation = (path: string) => {
    const pathToApp: Record<string, AppType> = {
      "/todos": "todos",
      "/documenten": "documents", 
      "/ruimtes": "room-reservation",
      "/workshops": "workshops",
      "/ledenbeheer": "ledenbeheer",
      "/wachtwoorden": "passwords",
      "/uitgaven": "expenses",
      "/tijdregistratie": "time-tracking",
      "/social-media": "social-media",
      "/beheer": "management",
      "/contacten": "contacts"
    };
    const appType = pathToApp[path];
    if (appType) {
      setCurrentApp(appType);
    }
  };

  const apps = [
    { 
      id: "dashboard" as const, 
      name: "Dashboard"
    },
    { 
      id: "ledenbeheer" as const, 
      name: "Ledenbeheer"
    },
    { 
      id: "documents" as const, 
      name: "Documenten"
    },
    { 
      id: "contacts" as const, 
      name: "Contacten"
    },
    { 
      id: "passwords" as const, 
      name: "Wachtwoorden"
    },
    { 
      id: "expenses" as const, 
      name: "Onkosten"
    },
    { 
      id: "time-tracking" as const, 
      name: "Tijdregistratie"
    },
    { 
      id: "workshops" as const, 
      name: "Workshops"
    },
    { 
      id: "social-media" as const, 
      name: "Social Media"
    },
    { 
      id: "room-reservation" as const, 
      name: "Reserveringen"
    },
    { 
      id: "todos" as const, 
      name: "Taken"
    },
    { 
      id: "management" as const, 
      name: "Beheer"
    },
  ];

  const renderCurrentApp = () => {
    switch (currentApp) {
      case "dashboard":
        return <FrontpageDashboard onSelectApp={handlePathNavigation} user={user || { _id: "", name: "", email: "" }} />;
      case "ledenbeheer":
        return <LedenbeheerApp />;
      case "documents":
        return <DocumentsApp />;
      case "contacts":
        return <ContactsApp />;
      case "passwords":
        return <PasswordsApp />;
      case "expenses":
        return <ExpensesApp />;
      case "time-tracking":
        return <TimeTrackingApp />;
      case "workshops":
        return <WorkshopsApp />;
      case "social-media":
        return <SocialMediaApp />;
      case "room-reservation":
        return <RoomReservationApp />;
      case "management":
        return <ManagementApp />;
      case "todos":
        return <TodoApp />;
      default:
        return <FrontpageDashboard onSelectApp={handlePathNavigation} user={user || { _id: "", name: "", email: "" }} />;
    }
  };

  return (
    <main className="h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-bold">BH</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Blooshoofd Platform</h1>
                <p className="text-gray-600">Welkom terug! Log in om verder te gaan.</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </div>
      </Unauthenticated>
      
      <Authenticated>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 flex flex-col transition-all duration-300`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">BH</span>
                  </div>
                  {!sidebarCollapsed && (
                    <div>
                      <h1 className="text-lg font-bold text-gray-900">Blooshoofd</h1>
                      <p className="text-sm text-gray-500">Platform</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sidebarCollapsed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setCurrentApp(app.id)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'px-4'} py-3 rounded-lg text-left transition-all duration-200 group ${
                    currentApp === app.id
                      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={sidebarCollapsed ? app.name : undefined}
                >
                  {sidebarCollapsed && (
                    <div className="w-full text-center">
                      <div className="font-medium text-sm">{app.name.charAt(0)}</div>
                    </div>
                  )}
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{app.name}</div>
                    </div>
                  )}
                </button>
              ))}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-200">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className={`flex items-center ${sidebarCollapsed ? '' : 'space-x-3'}`}>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || user?.email || "Gebruiker"}
                      </p>
                    </div>
                  )}
                </div>
                {!sidebarCollapsed && <SignOutButton />}
              </div>
              {sidebarCollapsed && (
                <div className="mt-2 flex justify-center">
                  <SignOutButton />
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            {renderCurrentApp()}
          </div>
        </div>
      </Authenticated>
    </main>
  );
}

export default App;
