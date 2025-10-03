import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AllWorkshopsCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const workshops = useQuery(api.workshops.listWorkshops, {});

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      } else if (viewMode === 'week') {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      } else {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      }
      return newDate;
    });
  };

  const getWorkshopsForDate = (date: Date) => {
    if (!workshops) return [];
    
    return workshops.filter(workshop => {
      if (!workshop.date) return false;
      const workshopDate = new Date(workshop.date);
      return (
        workshopDate.getDate() === date.getDate() &&
        workshopDate.getMonth() === date.getMonth() &&
        workshopDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    const monthNames = [
      "Januari", "Februari", "Maart", "April", "Mei", "Juni",
      "Juli", "Augustus", "September", "Oktober", "November", "December"
    ];
    
    if (viewMode === 'month') {
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(date);
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
    } else {
      return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const dayNames = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2 h-32"></div>;
              }

              const dayWorkshops = getWorkshopsForDate(day);
              const isToday = 
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`p-2 h-32 border rounded-md ${
                    isToday ? 'bg-yellow-50 border-yellow-200' : 'border-gray-200'
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-yellow-700' : 'text-gray-900'
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    {dayWorkshops.slice(0, 3).map((workshop, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate"
                        title={`${workshop.title} - ${workshop.startTime || ''}`}
                      >
                        {workshop.startTime && `${workshop.startTime} `}
                        {workshop.title}
                      </div>
                    ))}
                    {dayWorkshops.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayWorkshops.length - 3} meer
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const dayNames = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="grid grid-cols-7 gap-1 p-4">
          {weekDays.map((day, index) => {
            const dayWorkshops = getWorkshopsForDate(day);
            const isToday = 
              day.getDate() === new Date().getDate() &&
              day.getMonth() === new Date().getMonth() &&
              day.getFullYear() === new Date().getFullYear();

            return (
              <div key={index} className="border rounded-md p-3 min-h-[300px]">
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'text-yellow-700' : 'text-gray-900'
                }`}>
                  <div>{dayNames[index]}</div>
                  <div className={`text-lg ${isToday ? 'bg-yellow-100 rounded-full w-8 h-8 flex items-center justify-center' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayWorkshops.map((workshop) => (
                    <div
                      key={workshop._id}
                      className="bg-blue-50 border border-blue-200 rounded p-2 text-xs"
                    >
                      <div className="font-medium text-blue-900">{workshop.title}</div>
                      {workshop.startTime && (
                        <div className="text-blue-700">{workshop.startTime}</div>
                      )}
                      {workshop.location && (
                        <div className="text-blue-600">{workshop.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayWorkshops = getWorkshopsForDate(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="space-y-4">
            {dayWorkshops.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Geen workshops gepland voor deze dag.</p>
              </div>
            ) : (
              dayWorkshops.map((workshop) => (
                <div key={workshop._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{workshop.title}</h3>
                      {workshop.description && (
                        <p className="text-gray-600 mt-1">{workshop.description}</p>
                      )}
                      <div className="mt-3 space-y-2">
                        {workshop.startTime && workshop.endTime && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {workshop.startTime} - {workshop.endTime}
                          </div>
                        )}
                        {workshop.location && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {workshop.location}
                          </div>
                        )}
                        {workshop.maxParticipants && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            Max {workshop.maxParticipants} deelnemers
                          </div>
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
                        <div className="mt-2 text-lg font-semibold text-gray-900">
                          {workshop.price > 0 ? `€${workshop.price}` : 'Gratis'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workshop Overzicht</h2>
          <p className="text-gray-600">Bekijk alle workshops in kalender formaat</p>
        </div>
        
        {/* View Mode Selector */}
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'month' ? 'Maand' : mode === 'week' ? 'Week' : 'Dag'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigateDate('prev')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Vorige
        </button>
        
        <h3 className="text-xl font-semibold text-gray-900">
          {formatDate(currentDate)}
        </h3>
        
        <button
          onClick={() => navigateDate('next')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          Volgende
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar View */}
      {workshops === undefined ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-2">Workshops laden...</p>
        </div>
      ) : (
        <>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </>
      )}
    </div>
  );
}
