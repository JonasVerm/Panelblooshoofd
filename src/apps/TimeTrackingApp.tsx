import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function TimeTrackingApp() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [currentView, setCurrentView] = useState<"list" | "calendar" | "projects">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const users = useQuery(api.timeTracking.getAllUsers, {});
  const currentUser = useQuery(api.auth.loggedInUser);
  
  // Use selected user or current user for data queries
  const targetUserId = selectedUserId || currentUser?._id;
  
  const timeEntries = useQuery(api.timeTracking.listTimeEntries, 
    targetUserId ? { userId: targetUserId as Id<"users"> } : "skip"
  );
  const monthlyData = useQuery(api.timeTracking.getMonthlyEntries, 
    targetUserId ? {
      year: currentYear,
      month: currentMonth,
      userId: targetUserId as Id<"users">
    } : "skip"
  );
  const projects = useQuery(api.timeTracking.listProjects, {});
  
  const createManualTimeEntry = useMutation(api.timeTracking.createManualTimeEntry);
  const deleteTimeEntry = useMutation(api.timeTracking.deleteTimeEntry);

  const filteredEntries = timeEntries?.filter(entry => {
    if (!selectedProject) return true;
    return entry.project === selectedProject;
  });

  const totalHours = filteredEntries?.reduce((sum, entry) => {
    return sum + (entry.duration || 0);
  }, 0) || 0;

  const formatHours = (milliseconds: number) => {
    const hours = milliseconds / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100;
  };

  const handleCreateTimeEntry = async (formData: any) => {
    try {
      await createManualTimeEntry(formData);
      toast.success("Tijdregistratie succesvol toegevoegd");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Fout bij toevoegen tijdregistratie");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm("Weet je zeker dat je deze tijdregistratie wilt verwijderen?")) {
      try {
        await deleteTimeEntry({ timeEntryId: entryId as Id<"timeEntries"> });
        toast.success("Tijdregistratie verwijderd");
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen tijdregistratie");
      }
    }
  };

  const stats = {
    total: timeEntries?.length || 0,
    totalTime: totalHours,
    monthlyHours: monthlyData?.totalHours || 0,
    monthlyEntries: monthlyData?.entries?.length || 0,
  };

  const monthNames = [
    "Januari", "Februari", "Maart", "April", "Mei", "Juni",
    "Juli", "Augustus", "September", "Oktober", "November", "December"
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    return firstDay === 0 ? 7 : firstDay; // Convert Sunday (0) to 7
  };

  const getEntriesForDate = (date: string) => {
    return monthlyData?.entries?.filter(entry => entry.date === date) || [];
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 1; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEntries = getEntriesForDate(dateString);
      const dayHours = dayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / (1000 * 60 * 60);

      days.push(
        <div key={day} className="h-24 border border-gray-200 p-1 bg-white hover:bg-gray-50">
          <div className="font-medium text-sm text-gray-900 mb-1">{day}</div>
          {dayHours > 0 && (
            <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
              {Math.round(dayHours * 100) / 100}h
            </div>
          )}
          {dayEntries.slice(0, 2).map((entry, index) => (
            <div key={index} className="text-xs text-gray-600 truncate mt-0.5">
              {entry.description}
            </div>
          ))}
          {dayEntries.length > 2 && (
            <div className="text-xs text-gray-400">+{dayEntries.length - 2} meer</div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedUser = users?.find(u => u._id === targetUserId);
  const isViewingOwnData = !selectedUserId || selectedUserId === currentUser?._id;

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView("list")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                currentView === "list"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Tijdregistraties</span>
            </button>
            <button
              onClick={() => setCurrentView("calendar")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                currentView === "calendar"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0h6m-6 0V7a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-1-1h-1" />
              </svg>
              <span>Kalender</span>
            </button>
            <button
              onClick={() => setCurrentView("projects")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                currentView === "projects"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Projecten</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto p-6">
            {/* Header with User Selection and Add Time Button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentView === "list" && "Tijdregistraties"}
                  {currentView === "calendar" && "Kalender"}
                  {currentView === "projects" && "Projecten"}
                </h1>
                {selectedUser && !isViewingOwnData && (
                  <p className="text-gray-600 mt-1">
                    Bekijkt gegevens van: <span className="font-medium">{selectedUser.name}</span>
                  </p>
                )}
              </div>
              {currentView !== "projects" && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Tijd Toevoegen
                  </button>
                </div>
              )}
            </div>

            {/* Stats - only show for list and calendar views */}
            {currentView !== "projects" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Totaal Registraties</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Totale Tijd</p>
                      <p className="text-2xl font-bold text-gray-900">{formatHours(stats.totalTime)}h</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0h6m-6 0V7a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-1-1h-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Deze Maand</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.monthlyHours}h</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Maand Registraties</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.monthlyEntries}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Controls */}
            {currentView !== "projects" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    {/* User Selection */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gebruiker</label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Mijzelf</option>
                        {users?.filter(user => user._id !== currentUser?._id).map(user => (
                          <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Project Filter - only show for list view */}
                    {currentView === "list" && (
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                        <select
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Alle Projecten</option>
                          {projects?.map(project => (
                            <option key={project._id} value={project.name}>{project.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Month Navigation - only show for calendar view */}
                  {currentView === "calendar" && (
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {monthNames[currentMonth - 1]} {currentYear}
                      </h2>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="text-sm text-gray-600 ml-4">
                        Totaal: {stats.monthlyHours}h
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content based on view */}
            {currentView === "list" ? (
              <div className="bg-white rounded-lg border border-gray-200">
                {filteredEntries && filteredEntries.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredEntries.map((entry) => (
                      <TimeEntryItem
                        key={entry._id}
                        entry={entry}
                        onDelete={handleDeleteEntry}
                        formatHours={formatHours}
                        users={users || []}
                        canDelete={isViewingOwnData}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Geen tijdregistraties gevonden</h3>
                    <p className="text-gray-600">
                      {selectedProject
                        ? "Geen registraties voor dit project gevonden"
                        : isViewingOwnData 
                          ? "Voeg je eerste tijdregistratie toe om te beginnen"
                          : "Deze gebruiker heeft nog geen tijdregistraties"
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : currentView === "calendar" ? (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="grid grid-cols-7 gap-0">
                  {/* Calendar header */}
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50 border-b border-gray-200">
                      {day}
                    </div>
                  ))}
                  {/* Calendar days */}
                  {renderCalendar()}
                </div>
              </div>
            ) : (
              <ProjectsManager projects={projects || []} />
            )}
          </div>
        </div>
      </div>

      {/* Add Time Entry Modal */}
      {showCreateForm && (
        <TimeEntryModal
          onSubmit={handleCreateTimeEntry}
          onClose={() => setShowCreateForm(false)}
          projects={projects || []}
          users={users || []}
          selectedUserId={selectedUserId}
        />
      )}
    </div>
  );
}

interface TimeEntryItemProps {
  entry: any;
  onDelete: (entryId: string) => void;
  formatHours: (milliseconds: number) => number;
  users: any[];
  canDelete: boolean;
}

function TimeEntryItem({ entry, onDelete, formatHours, users, canDelete }: TimeEntryItemProps) {
  const user = users.find(u => u._id === entry.userId);
  const createdByUser = users.find(u => u._id === entry.createdBy);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {entry.description}
            </h3>
          </div>

          <div className="flex items-center space-x-6 mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Tijd:</span>
              <span className="text-lg font-semibold text-blue-600">
                {formatHours(entry.duration || 0)}h
              </span>
            </div>

            {entry.project && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Project:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {entry.project}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Datum:</span>
              <span className="text-sm text-gray-900">
                {entry.date ? new Date(entry.date).toLocaleDateString('nl-NL') : 'Onbekend'}
              </span>
            </div>

            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Gebruiker:</span>
                <span className="text-sm text-gray-900">{user.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center text-xs text-gray-500 space-x-4">
            <span>Aangemaakt: {new Date(entry.createdAt || entry.startTime).toLocaleDateString('nl-NL')}</span>
            <span>Bijgewerkt: {new Date(entry.updatedAt || entry.startTime).toLocaleDateString('nl-NL')}</span>
            {createdByUser && entry.createdBy !== entry.userId && (
              <span>Door: {createdByUser.name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {canDelete && (
            <button
              onClick={() => onDelete(entry._id)}
              className="text-gray-400 hover:text-red-600 p-1"
              title="Tijdregistratie verwijderen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface TimeEntryModalProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  projects: any[];
  users: any[];
  selectedUserId?: string;
}

function TimeEntryModal({ onSubmit, onClose, projects, users, selectedUserId }: TimeEntryModalProps) {
  const [formData, setFormData] = useState({
    description: "",
    hours: 1,
    date: new Date().toISOString().split('T')[0],
    project: "",
    userId: selectedUserId || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      userId: formData.userId || undefined,
    };
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Tijd Toevoegen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Waar heb je aan gewerkt?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aantal uren *
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: parseFloat(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={formData.project}
              onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecteer project</option>
              {projects.map(project => (
                <option key={project._id} value={project.name}>{project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gebruiker
            </label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Mijzelf</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Toevoegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ProjectsManagerProps {
  projects: any[];
}

function ProjectsManager({ projects }: ProjectsManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const createProject = useMutation(api.timeTracking.createProject);
  const updateProject = useMutation(api.timeTracking.updateProject);
  const deleteProject = useMutation(api.timeTracking.deleteProject);

  const handleCreateProject = async (formData: any) => {
    try {
      await createProject(formData);
      toast.success("Project succesvol aangemaakt");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Fout bij aanmaken project");
    }
  };

  const handleUpdateProject = async (formData: any) => {
    try {
      await updateProject({ projectId: editingProject._id, ...formData });
      toast.success("Project succesvol bijgewerkt");
      setEditingProject(null);
    } catch (error: any) {
      toast.error(error.message || "Fout bij bijwerken project");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("Weet je zeker dat je dit project wilt verwijderen?")) {
      try {
        await deleteProject({ projectId: projectId as Id<"projects"> });
        toast.success("Project verwijderd");
      } catch (error: any) {
        toast.error(error.message || "Fout bij verwijderen project");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600">Beheer je projecten voor tijdregistratie</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Nieuw Project
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {projects.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <div key={project._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {project.name}
                      </h3>
                    </div>
                    {project.description && (
                      <p className="text-gray-600 mb-2">{project.description}</p>
                    )}
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span>Aangemaakt: {new Date(project.createdAt).toLocaleDateString('nl-NL')}</span>
                      <span>Bijgewerkt: {new Date(project.updatedAt).toLocaleDateString('nl-NL')}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingProject(project)}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title="Project bewerken"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project._id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Project verwijderen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen projecten gevonden</h3>
            <p className="text-gray-600">Maak je eerste project aan om te beginnen</p>
          </div>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      {(showCreateForm || editingProject) && (
        <ProjectModal
          project={editingProject}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
          onClose={() => {
            setShowCreateForm(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}

interface ProjectModalProps {
  project?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

function ProjectModal({ project, onSubmit, onClose }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    color: project?.color || "#3B82F6",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {project ? "Project Bewerken" : "Nieuw Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naam *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Projectnaam"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Projectbeschrijving"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kleur
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {project ? "Bijwerken" : "Aanmaken"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
