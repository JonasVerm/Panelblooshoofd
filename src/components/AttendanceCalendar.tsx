import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { exportAttendanceToPDF } from "../lib/pdfExport";

export function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Id<"activities"> | null>(null);

  // Get activities for the current month
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const activities = useQuery(api.memberActivities.getActivities, {
    startDate: startOfMonth.getTime(),
    endDate: endOfMonth.getTime(),
    isActive: true,
  });

  const activityWithAttendance = useQuery(
    api.memberActivities.getActivityWithAttendance,
    selectedActivity ? { id: selectedActivity } : "skip"
  );

  const markAttendance = useMutation(api.attendance.markAttendance);
  const bulkMarkAttendance = useMutation(api.attendance.bulkMarkAttendance);

  const handleAttendanceChange = async (
    memberId: Id<"members">,
    status: "aanwezig" | "afwezig",
    notitie?: string
  ) => {
    if (!selectedActivity) return;

    try {
      await markAttendance({
        activityId: selectedActivity,
        memberId,
        status,
        notitie,
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const handleBulkAttendance = async (status: "aanwezig" | "afwezig") => {
    if (!selectedActivity || !activityWithAttendance?.members) return;

    const attendanceData = activityWithAttendance.members.map(member => ({
      memberId: member._id,
      status,
    }));

    try {
      await bulkMarkAttendance({
        activityId: selectedActivity,
        attendanceData,
      });
    } catch (error) {
      console.error("Error bulk marking attendance:", error);
    }
  };

  // Helper functions for calendar
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to be last (6)
  };

  const getActivitiesForDate = (date: Date) => {
    if (!activities) return [];
    const dateStr = date.toDateString();
    return activities
      .filter(activity => 
        new Date(activity.datum).toDateString() === dateStr
      )
      .sort((a, b) => {
        // Sort by start time (earliest first)
        return a.startTijd.localeCompare(b.startTijd);
      });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedActivity(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedActivity(null);
  };

  if (!activities) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Activiteitenkalender</h2>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Vandaag
          </button>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('nl-NL', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="h-32 border-r border-b border-gray-100"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayActivities = getActivitiesForDate(date);
              const isToday = isCurrentMonth && day === today.getDate();
              
              return (
                <div
                  key={day}
                  className="h-32 border-r border-b border-gray-100 p-1 relative overflow-hidden"
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
                  }`}>
                    {day}
                  </div>
                  
                  <div className="space-y-1">
                    {dayActivities.slice(0, 3).map((activity) => (
                      <button
                        key={activity._id}
                        onClick={() => setSelectedActivity(activity._id)}
                        className={`w-full text-left text-xs p-1 rounded truncate transition-colors ${
                          selectedActivity === activity._id
                            ? "text-white shadow-md"
                            : "text-white hover:opacity-80"
                        }`}
                        style={{ backgroundColor: activity.kleur || "#3B82F6" }}
                        title={`${activity.naam} (${activity.startTijd} - ${activity.eindTijd})`}
                      >
                        {activity.naam}
                      </button>
                    ))}
                    {dayActivities.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayActivities.length - 3} meer
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attendance Management */}
      {selectedActivity && activityWithAttendance && (
        <div className="bg-white rounded-lg border border-gray-200 mt-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {activityWithAttendance.naam}
                </h3>
                <p className="text-gray-600">
                  {new Date(activityWithAttendance.datum).toLocaleDateString('nl-NL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-gray-600">
                  {activityWithAttendance.startTijd} - {activityWithAttendance.eindTijd}
                </p>
                {activityWithAttendance.locatie && (
                  <p className="text-gray-600 mt-1">📍 {activityWithAttendance.locatie}</p>
                )}
                {activityWithAttendance.beschrijving && (
                  <p className="text-gray-600 mt-1">{activityWithAttendance.beschrijving}</p>
                )}
              </div>
              
              {/* Attendance Summary */}
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  <div>Aanwezig: <span className="font-semibold text-green-600">{activityWithAttendance.attendanceCount.aanwezig}</span></div>
                  <div>Afwezig: <span className="font-semibold text-red-600">{activityWithAttendance.attendanceCount.afwezig}</span></div>
                  <div>Totaal: <span className="font-semibold">{activityWithAttendance.attendanceCount.total}</span></div>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => handleBulkAttendance("aanwezig")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Iedereen Aanwezig
              </button>
              <button
                onClick={() => handleBulkAttendance("afwezig")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Iedereen Afwezig
              </button>
              <button
                onClick={() => exportAttendanceToPDF(activityWithAttendance)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF</span>
              </button>
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Sluiten
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="p-6">
            <div className="space-y-3">
              {activityWithAttendance.members.map((member) => {
                const attendance = activityWithAttendance.attendance.find(a => a.memberId === member._id);
                
                return (
                  <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.voornaam.charAt(0)}{member.naam.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.voornaam} {member.naam}
                        </p>
                        <p className="text-sm text-gray-500">{member.emailAdres || ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAttendanceChange(member._id, "aanwezig")}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            attendance?.status === "aanwezig"
                              ? "bg-green-100 text-green-800 border-2 border-green-300"
                              : "bg-gray-100 text-gray-600 hover:bg-green-50"
                          }`}
                        >
                          Aanwezig
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(member._id, "afwezig")}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            attendance?.status === "afwezig"
                              ? "bg-red-100 text-red-800 border-2 border-red-300"
                              : "bg-gray-100 text-gray-600 hover:bg-red-50"
                          }`}
                        >
                          Afwezig
                        </button>
                      </div>
                      
                      {attendance?.notitie && (
                        <div className="text-xs text-gray-500 max-w-32 truncate" title={attendance.notitie}>
                          📝 {attendance.notitie}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
