import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface User {
  _id: string;
  name?: string;
  email?: string;
}

interface FrontpageDashboardProps {
  onSelectApp: (path: string) => void;
  user: User;
}

export function FrontpageDashboard({ onSelectApp, user }: FrontpageDashboardProps) {
  const recentTodos = useQuery(api.todos.getUserTodos, {});
  const recentDocuments = useQuery(api.documents.getRecentDocuments, { limit: 5 });
  const upcomingWorkshops = useQuery(api.workshops.listWorkshops, { limit: 3 });
  const todayReservations = useQuery(api.roomReservations.getReservations, { 
    date: new Date().toISOString().split('T')[0] 
  });

  const quickActions = [
    {
      name: "Nieuwe Taak",
      description: "Voeg een nieuwe taak toe",
      path: "/todos",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: "bg-blue-500"
    },
    {
      name: "Document Uploaden",
      description: "Upload een nieuw document",
      path: "/documenten",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      color: "bg-green-500"
    },
    {
      name: "Ruimte Reserveren",
      description: "Reserveer een ruimte",
      path: "/ruimtes",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: "bg-purple-500"
    },
    {
      name: "Workshop Aanmaken",
      description: "Maak een nieuwe workshop",
      path: "/workshops",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "bg-orange-500"
    }
  ];

  const stats = [
    {
      name: "Actieve Taken",
      value: recentTodos?.filter(todo => !todo.isCompleted).length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      name: "Documenten",
      value: recentDocuments?.length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      name: "Komende Workshops",
      value: upcomingWorkshops?.length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      name: "Vandaag Reserveringen",
      value: todayReservations?.length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welkom terug, {user.name || user.email}!
        </h1>
        <p className="text-gray-600">
          Hier is een overzicht van je activiteiten en snelle acties.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`${stat.bgColor} rounded-lg p-3`}>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.name}
              onClick={() => onSelectApp(action.path)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center mb-3">
                <div className={`${action.color} rounded-lg p-2 text-white group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.name}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recente Taken</h3>
            <button
              onClick={() => onSelectApp("/todos")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Alle taken →
            </button>
          </div>
          <div className="space-y-3">
            {recentTodos?.slice(0, 5).map((todo) => (
              <div key={todo._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${todo.isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${todo.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="text-xs text-gray-500 truncate">{todo.description}</p>
                  )}
                </div>
              </div>
            ))}
            {(!recentTodos || recentTodos.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Geen recente taken</p>
            )}
          </div>
        </div>

        {/* Today's Reservations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vandaag Reserveringen</h3>
            <button
              onClick={() => onSelectApp("/ruimtes")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Alle reserveringen →
            </button>
          </div>
          <div className="space-y-3">
            {todayReservations?.slice(0, 5).map((reservation) => (
              <div key={reservation._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: reservation.room?.color || "#3B82F6" }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {reservation.room?.name} - {reservation.customerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reservation.startTime} - {reservation.endTime}
                    {reservation.purpose && ` • ${reservation.purpose}`}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  reservation.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : reservation.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {reservation.status === "confirmed" ? "Bevestigd" :
                   reservation.status === "pending" ? "Wachtend" : "Geannuleerd"}
                </div>
              </div>
            ))}
            {(!todayReservations || todayReservations.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Geen reserveringen vandaag</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Workshops */}
      {upcomingWorkshops && upcomingWorkshops.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Komende Workshops</h3>
            <button
              onClick={() => onSelectApp("/workshops")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Alle workshops →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingWorkshops.map((workshop) => (
              <div key={workshop._id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{workshop.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{workshop.description}</p>
                <div className="text-xs text-gray-500">
                  <div>📅 {new Date(workshop.date).toLocaleDateString('nl-NL')}</div>
                  <div>🕐 {workshop.startTime} - {workshop.endTime}</div>
                  <div>👥 {workshop.maxParticipants} deelnemers max</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
