import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function TimeTrackingManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [currentTimer, setCurrentTimer] = useState<string | null>(null);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const timeEntries = useQuery(api.timeTracking.listTimeEntries, {});
  const runningEntry = timeEntries?.find(entry => entry.isRunning);
  const createTimeEntry = useMutation(api.timeTracking.createTimeEntry);
  const stopTimeEntry = useMutation(api.timeTracking.stopTimeEntry);
  const deleteTimeEntry = useMutation(api.timeTracking.deleteTimeEntry);

  // Update timer display
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (runningEntry && runningEntry.isRunning) {
      setCurrentTimer(runningEntry._id);
      setTimerStart(runningEntry.startTime);
      
      interval = setInterval(() => {
        setElapsedTime(Date.now() - runningEntry.startTime);
      }, 1000);
    } else {
      setCurrentTimer(null);
      setTimerStart(null);
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runningEntry]);

  const projects = [
    "Development",
    "Design",
    "Marketing",
    "Administration",
    "Client Work",
    "Research",
    "Meetings",
    "Training",
    "Other"
  ];

  const filteredEntries = timeEntries?.filter(entry => {
    if (!selectedProject) return true;
    return entry.project === selectedProject;
  });

  const totalHours = filteredEntries?.reduce((sum, entry) => {
    return sum + (entry.duration || 0);
  }, 0) || 0;

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleStartTimer = async (description: string, project: string) => {
    try {
      await createTimeEntry({
        description,
        project,
        startTime: Date.now(),
      });
      toast.success("Timer started");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to start timer");
    }
  };

  const handleStopTimer = async () => {
    if (!currentTimer) return;
    
    try {
      await stopTimeEntry({ timeEntryId: currentTimer as Id<"timeEntries"> });
      toast.success("Timer stopped");
    } catch (error: any) {
      toast.error(error.message || "Failed to stop timer");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      try {
        await deleteTimeEntry({ timeEntryId: entryId as Id<"timeEntries"> });
        toast.success("Time entry deleted");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete time entry");
      }
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor and analyze your time usage</p>
          </div>
          <div className="flex items-center space-x-3">
            {currentTimer ? (
              <button
                onClick={handleStopTimer}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Stop Timer ({formatDuration(elapsedTime)})
              </button>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Start Timer
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{timeEntries?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(totalHours)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${currentTimer ? 'bg-green-100' : 'bg-gray-100'}`}>
                <svg className={`w-6 h-6 ${currentTimer ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a1 1 0 001 1h4M9 10V9a1 1 0 011-1h4a1 1 0 011 1v1M9 10H8a1 1 0 00-1 1v3a1 1 0 001 1h1m0-4h4m0 0v4m0-4V9m0 4h1a1 1 0 001-1v-3a1 1 0 00-1-1h-1m0 4V9" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentTimer ? "Running" : "Stopped"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setSelectedProject("")}
                className="px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        {/* Time Entries List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredEntries && filteredEntries.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <div key={entry._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {entry.description}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <span className={`text-xl font-bold ${
                            entry.isRunning ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {entry.duration ? formatDuration(entry.duration) : formatDuration(elapsedTime)}
                          </span>
                          {entry.isRunning && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Running
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteEntry(entry._id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Delete entry"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        {entry.project && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {entry.project}
                          </span>
                        )}
                        <span>Started: {new Date(entry.startTime).toLocaleString()}</span>
                        {entry.endTime && (
                          <span>Ended: {new Date(entry.endTime).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries found</h3>
              <p className="text-gray-600">
                {selectedProject
                  ? "No entries for this project yet"
                  : "Start your first timer to begin tracking time"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Start Timer Modal */}
      {showCreateForm && (
        <StartTimerModal
          onSubmit={handleStartTimer}
          onClose={() => setShowCreateForm(false)}
          projects={projects}
        />
      )}
    </div>
  );
}

interface StartTimerModalProps {
  onSubmit: (description: string, project: string) => void;
  onClose: () => void;
  projects: string[];
}

function StartTimerModal({ onSubmit, onClose, projects }: StartTimerModalProps) {
  const [formData, setFormData] = useState({
    description: "",
    project: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData.description, formData.project);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Start New Timer</h2>
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
              What are you working on? *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your task..."
              required
            />
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
              <option value="">Select project</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Start Timer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
