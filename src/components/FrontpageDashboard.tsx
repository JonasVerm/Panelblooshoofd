import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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
  | "todos";

interface FrontpageDashboardProps {
  onSelectApp: (app: AppType) => void;
  user: any;
}

export function FrontpageDashboard({ onSelectApp, user }: FrontpageDashboardProps) {
  const workshops = useQuery(api.workshops.listWorkshops, { limit: 5 });
  const teachers = useQuery(api.teachers.listTeachers, {});
  const members = useQuery(api.members.getMembers, {});

  const apps = [
    {
      id: "workshops" as const,
      name: "Workshops",
      description: "Beheer workshops en evenementen",
      icon: "📚",
      color: "bg-blue-500"
    },
    {
      id: "ledenbeheer" as const,
      name: "Ledenbeheer",
      description: "Beheer leden en groepen",
      icon: "👥",
      color: "bg-green-500"
    },
    {
      id: "documents" as const,
      name: "Documenten",
      description: "Beheer bestanden en documenten",
      icon: "📁",
      color: "bg-indigo-500"
    },
    {
      id: "expenses" as const,
      name: "Uitgaven",
      description: "Beheer uitgaven en kosten",
      icon: "💰",
      color: "bg-red-500"
    },
    {
      id: "social-media" as const,
      name: "Social Media",
      description: "Beheer social media content",
      icon: "📱",
      color: "bg-pink-500"
    },
    {
      id: "time-tracking" as const,
      name: "Tijdregistratie",
      description: "Registreer gewerkte uren",
      icon: "⏰",
      color: "bg-yellow-500"
    },
    {
      id: "passwords" as const,
      name: "Wachtwoorden",
      description: "Beheer wachtwoorden veilig",
      icon: "🔐",
      color: "bg-gray-500"
    },
    {
      id: "todos" as const,
      name: "Taken",
      description: "Beheer taken en to-do's",
      icon: "✅",
      color: "bg-teal-500"
    },
    {
      id: "management" as const,
      name: "Beheer",
      description: "Systeem beheer en instellingen",
      icon: "⚙️",
      color: "bg-slate-500"
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Goedemorgen";
    if (hour < 18) return "Goedemiddag";
    return "Goedenavond";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getGreeting()}, {user?.name || "Gebruiker"}!
              </h1>
              <p className="text-gray-600 mt-1">
                Welkom op je Blooshoofd dashboard!
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Snelle Acties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onSelectApp("workshops")}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📚</div>
                <div>
                  <h3 className="font-medium text-blue-900">Nieuwe Workshop</h3>
                  <p className="text-sm text-blue-700">Maak een nieuwe workshop aan</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => onSelectApp("ledenbeheer")}
              className="bg-green-50 border border-green-200 rounded-lg p-4 text-left hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">👥</div>
                <div>
                  <h3 className="font-medium text-green-900">Lid Toevoegen</h3>
                  <p className="text-sm text-green-700">Voeg een nieuw lid toe</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Workshops */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recente Workshops</h2>
            <button
              onClick={() => onSelectApp("workshops")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Bekijk alle →
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border">
            {workshops === undefined ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="text-gray-600 mt-2">Workshops laden...</p>
              </div>
            ) : workshops.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen workshops gevonden</h3>
                <p className="text-gray-600 mb-4">Begin met het maken van je eerste workshop.</p>
                <button
                  onClick={() => onSelectApp("workshops")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Workshop Maken
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {workshops.slice(0, 5).map((workshop) => (
                  <div key={workshop._id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{workshop.title}</h3>
                        {workshop.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {workshop.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          {workshop.date && (
                            <span>📅 {new Date(workshop.date).toLocaleDateString('nl-NL')}</span>
                          )}
                          {workshop.startTime && (
                            <span>🕐 {workshop.startTime}</span>
                          )}
                          {workshop.location && (
                            <span>📍 {workshop.location}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        {workshop.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {workshop.category}
                          </span>
                        )}
                        {workshop.price !== undefined && (
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {workshop.price > 0 ? `€${workshop.price}` : 'Gratis'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Apps Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Alle Applicaties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => onSelectApp(app.id)}
                className="bg-white rounded-lg shadow-sm border p-6 text-left hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`${app.color} rounded-lg p-3 text-white text-2xl group-hover:scale-110 transition-transform`}>
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {app.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
