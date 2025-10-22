import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

type AdminView = "reservations" | "rooms" | "availability" | "unavailability" | "calendar";

export function RoomReservationAdmin() {
  const [currentView, setCurrentView] = useState<AdminView>("reservations");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case "reservations":
        return <ReservationsManager selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      case "rooms":
        return <RoomsManager />;
      case "availability":
        return <AvailabilityManager />;
      case "unavailability":
        return <UnavailabilityManager />;
      case "calendar":
        return <CalendarView selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      default:
        return <ReservationsManager selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView("reservations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "reservations"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reserveringen
            </button>
            <button
              onClick={() => setCurrentView("calendar")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "calendar"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Kalender Overzicht
            </button>
            <button
              onClick={() => setCurrentView("rooms")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "rooms"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Ruimtes Beheren
            </button>
            <button
              onClick={() => setCurrentView("availability")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "availability"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Openingstijden
            </button>
            <button
              onClick={() => setCurrentView("unavailability")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "unavailability"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Niet Beschikbaar
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {renderCurrentView()}
    </div>
  );
}

function ReservationsManager({ selectedDate, setSelectedDate }: { 
  selectedDate: string; 
  setSelectedDate: (date: string) => void; 
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [editingReservation, setEditingReservation] = useState<any>(null);

  const rooms = useQuery(api.roomReservations.getRooms);
  const reservations = useQuery(
    api.roomReservations.getReservations,
    selectedRoomId && selectedDate
      ? { roomId: selectedRoomId, date: selectedDate }
      : selectedDate
      ? { date: selectedDate }
      : {}
  );

  const updateReservationStatus = useMutation(api.roomReservations.updateReservationStatus);
  const deleteReservation = useMutation(api.roomReservations.deleteReservation);

  const handleStatusChange = async (reservationId: Id<"roomReservations">, status: "confirmed" | "pending" | "cancelled") => {
    try {
      await updateReservationStatus({ reservationId, status });
      toast.success("Status bijgewerkt");
    } catch (error) {
      toast.error("Fout bij bijwerken status");
    }
  };

  const handleDeleteReservation = async (reservationId: Id<"roomReservations">) => {
    if (!confirm("Weet je zeker dat je deze reservering wilt verwijderen?")) return;
    
    try {
      await deleteReservation({ reservationId });
      toast.success("Reservering verwijderd");
    } catch (error) {
      toast.error("Fout bij verwijderen reservering");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reserveringen Beheren</h1>
        <p className="text-gray-600">Bekijk en beheer alle ruimte reserveringen</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Datum
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
              Ruimte (optioneel)
            </label>
            <select
              id="room"
              value={selectedRoomId || ""}
              onChange={(e) => setSelectedRoomId(e.target.value as Id<"rooms"> || null)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle ruimtes</option>
              {rooms?.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Reserveringen {selectedDate && `voor ${new Date(selectedDate).toLocaleDateString('nl-NL')}`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruimte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum & Tijd
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations?.map((reservation) => (
                <tr key={reservation._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: reservation.room?.color || "#3B82F6" }}
                      ></div>
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.room?.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reservation.customerName}</div>
                    {reservation.customerEmail && (
                      <div className="text-sm text-gray-500">{reservation.customerEmail}</div>
                    )}
                    {reservation.customerPhone && (
                      <div className="text-sm text-gray-500">{reservation.customerPhone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(reservation.date).toLocaleDateString('nl-NL')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.startTime} - {reservation.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{reservation.purpose || "-"}</div>
                    {reservation.notes && (
                      <div className="text-sm text-gray-500 mt-1">{reservation.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(
                        reservation._id,
                        e.target.value as "confirmed" | "pending" | "cancelled"
                      )}
                      className={`text-sm rounded-full px-2 py-1 font-medium ${
                        reservation.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : reservation.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <option value="pending">Wachtend</option>
                      <option value="confirmed">Bevestigd</option>
                      <option value="cancelled">Geannuleerd</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteReservation(reservation._id)}
                      className="text-red-600 hover:text-red-900 ml-2"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {reservations?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p>Geen reserveringen gevonden voor de geselecteerde filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoomsManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "",
    equipment: "",
    color: "#3B82F6",
  });

  const rooms = useQuery(api.roomReservations.getRooms);
  const createRoom = useMutation(api.roomReservations.createRoom);
  const updateRoom = useMutation(api.roomReservations.updateRoom);
  const deleteRoom = useMutation(api.roomReservations.deleteRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const roomData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        equipment: formData.equipment.trim() ? formData.equipment.split(',').map(e => e.trim()) : undefined,
        color: formData.color,
      };

      if (editingRoom) {
        await updateRoom({
          roomId: editingRoom._id,
          ...roomData,
        });
        toast.success("Ruimte bijgewerkt");
        setEditingRoom(null);
      } else {
        await createRoom(roomData);
        toast.success("Ruimte aangemaakt");
        setShowCreateForm(false);
      }

      setFormData({
        name: "",
        description: "",
        capacity: "",
        equipment: "",
        color: "#3B82F6",
      });
    } catch (error) {
      toast.error("Fout bij opslaan ruimte");
    }
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || "",
      capacity: room.capacity?.toString() || "",
      equipment: room.equipment?.join(", ") || "",
      color: room.color || "#3B82F6",
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (roomId: Id<"rooms">) => {
    if (!confirm("Weet je zeker dat je deze ruimte wilt verwijderen?")) return;
    
    try {
      await deleteRoom({ roomId });
      toast.success("Ruimte verwijderd");
    } catch (error) {
      toast.error("Fout bij verwijderen ruimte");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      capacity: "",
      equipment: "",
      color: "#3B82F6",
    });
    setEditingRoom(null);
    setShowCreateForm(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ruimtes Beheren</h1>
          <p className="text-gray-600">Beheer alle beschikbare ruimtes</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Nieuwe Ruimte
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {rooms?.map((room) => (
          <div key={room._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: room.color }}
                ></div>
                <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(room)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(room._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {room.description && (
              <p className="text-gray-600 mb-3">{room.description}</p>
            )}
            
            <div className="space-y-2 text-sm text-gray-500">
              {room.capacity && (
                <div>Capaciteit: {room.capacity} personen</div>
              )}
              {room.equipment && room.equipment.length > 0 && (
                <div>Uitrusting: {room.equipment.join(", ")}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRoom ? "Ruimte Bewerken" : "Nieuwe Ruimte"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Capaciteit (personen)
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-1">
                    Uitrusting (gescheiden door komma's)
                  </label>
                  <input
                    type="text"
                    id="equipment"
                    value={formData.equipment}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                    placeholder="Beamer, WiFi, Whiteboard"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Kleur
                  </label>
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingRoom ? "Bijwerken" : "Aanmaken"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilityManager() {
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [schedule, setSchedule] = useState<{
    [key: string]: { startTime: string; endTime: string; enabled: boolean };
  }>({
    monday: { startTime: "09:00", endTime: "17:00", enabled: false },
    tuesday: { startTime: "09:00", endTime: "17:00", enabled: false },
    wednesday: { startTime: "09:00", endTime: "17:00", enabled: false },
    thursday: { startTime: "09:00", endTime: "17:00", enabled: false },
    friday: { startTime: "09:00", endTime: "17:00", enabled: false },
    saturday: { startTime: "09:00", endTime: "17:00", enabled: false },
    sunday: { startTime: "09:00", endTime: "17:00", enabled: false },
  });

  const rooms = useQuery(api.roomReservations.getRooms);
  const roomAvailability = useQuery(
    api.roomReservations.getRoomAvailabilitySchedule,
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  );
  const setRoomAvailability = useMutation(api.roomReservations.setRoomAvailability);

  const dayNames = {
    monday: "Maandag",
    tuesday: "Dinsdag", 
    wednesday: "Woensdag",
    thursday: "Donderdag",
    friday: "Vrijdag",
    saturday: "Zaterdag",
    sunday: "Zondag",
  };

  // Load existing availability when room is selected
  useEffect(() => {
    if (roomAvailability) {
      const newSchedule = { ...schedule };
      
      // Reset all days to disabled first
      Object.keys(newSchedule).forEach(day => {
        newSchedule[day].enabled = false;
      });

      // Set enabled days based on existing availability
      roomAvailability.forEach(avail => {
        if (newSchedule[avail.dayOfWeek]) {
          newSchedule[avail.dayOfWeek] = {
            startTime: avail.startTime,
            endTime: avail.endTime,
            enabled: true,
          };
        }
      });
      
      setSchedule(newSchedule);
    }
  }, [roomAvailability]);

  const handleScheduleChange = (day: string, field: string, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedRoomId) {
      toast.error("Selecteer eerst een ruimte");
      return;
    }

    try {
      const enabledSchedule = Object.entries(schedule)
        .filter(([_, config]) => config.enabled)
        .map(([day, config]) => ({
          dayOfWeek: day as any,
          startTime: config.startTime,
          endTime: config.endTime,
        }));

      await setRoomAvailability({
        roomId: selectedRoomId,
        schedule: enabledSchedule,
      });

      toast.success("Openingstijden opgeslagen");
    } catch (error) {
      toast.error("Fout bij opslaan openingstijden");
    }
  };

  const applyToAllDays = () => {
    const mondayConfig = schedule.monday;
    const newSchedule = { ...schedule };
    
    Object.keys(newSchedule).forEach(day => {
      if (day !== 'monday') {
        newSchedule[day] = {
          startTime: mondayConfig.startTime,
          endTime: mondayConfig.endTime,
          enabled: mondayConfig.enabled,
        };
      }
    });
    
    setSchedule(newSchedule);
  };

  const setWeekdayHours = () => {
    const newSchedule = { ...schedule };
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
      newSchedule[day] = {
        startTime: "16:00",
        endTime: "22:00",
        enabled: true,
      };
    });
    setSchedule(newSchedule);
  };

  const setWeekendHours = () => {
    const newSchedule = { ...schedule };
    ['saturday', 'sunday'].forEach(day => {
      newSchedule[day] = {
        startTime: "09:00",
        endTime: "22:00",
        enabled: true,
      };
    });
    setSchedule(newSchedule);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Openingstijden Beheren</h1>
        <p className="text-gray-600">Stel de standaard beschikbaarheid per dag per ruimte in</p>
      </div>

      {/* Room Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
              Selecteer Ruimte
            </label>
            <select
              id="room"
              value={selectedRoomId || ""}
              onChange={(e) => setSelectedRoomId(e.target.value as Id<"rooms"> || null)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Kies een ruimte</option>
              {rooms?.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {selectedRoomId && (
            <div className="flex space-x-2">
              <button
                onClick={setWeekdayHours}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Ma-Vr: 16:00-22:00
              </button>
              <button
                onClick={setWeekendHours}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Za-Zo: 09:00-22:00
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedRoomId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Openingstijden voor {rooms?.find(r => r._id === selectedRoomId)?.name}
            </h2>
            <button
              onClick={applyToAllDays}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Kopieer Maandag naar alle dagen
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(dayNames).map(([day, displayName]) => (
              <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 w-32">
                  <input
                    type="checkbox"
                    id={`${day}-enabled`}
                    checked={schedule[day].enabled}
                    onChange={(e) => handleScheduleChange(day, 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`${day}-enabled`} className="text-sm font-medium text-gray-700">
                    {displayName}
                  </label>
                </div>

                {schedule[day].enabled && (
                  <>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Van:</label>
                      <input
                        type="time"
                        value={schedule[day].startTime}
                        onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Tot:</label>
                      <input
                        type="time"
                        value={schedule[day].endTime}
                        onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {!schedule[day].enabled && (
                  <span className="text-sm text-gray-500 italic">Gesloten</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Openingstijden Opslaan
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Let op</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Reserveringen kunnen alleen gemaakt worden binnen de ingestelde openingstijden. 
                  Tijden buiten deze uren worden automatisch als "gesloten" gemarkeerd.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedRoomId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">Selecteer een ruimte om de openingstijden in te stellen</p>
        </div>
      )}
    </div>
  );
}

function UnavailabilityManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [formData, setFormData] = useState({
    roomId: "",
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });

  const rooms = useQuery(api.roomReservations.getRooms);
  const unavailability = useQuery(
    api.roomReservations.getUnavailability,
    selectedRoomId && selectedDate
      ? { roomId: selectedRoomId, date: selectedDate }
      : selectedDate
      ? { date: selectedDate }
      : {}
  );

  const createUnavailability = useMutation(api.roomReservations.createUnavailability);
  const deleteUnavailability = useMutation(api.roomReservations.deleteUnavailability);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setFormData(prev => ({ ...prev, date: today }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createUnavailability({
        roomId: formData.roomId as Id<"rooms">,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        reason: formData.reason.trim() || undefined,
      });

      toast.success("Niet-beschikbaarheid toegevoegd");
      setShowCreateForm(false);
      setFormData({
        roomId: "",
        date: selectedDate,
        startTime: "09:00",
        endTime: "17:00",
        reason: "",
      });
    } catch (error) {
      toast.error("Fout bij toevoegen niet-beschikbaarheid");
    }
  };

  const handleDelete = async (unavailabilityId: Id<"roomUnavailability">) => {
    if (!confirm("Weet je zeker dat je deze niet-beschikbaarheid wilt verwijderen?")) return;
    
    try {
      await deleteUnavailability({ unavailabilityId });
      toast.success("Niet-beschikbaarheid verwijderd");
    } catch (error) {
      toast.error("Fout bij verwijderen niet-beschikbaarheid");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Niet Beschikbaar Beheren</h1>
          <p className="text-gray-600">Stel periodes in waarin ruimtes niet beschikbaar zijn</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Niet Beschikbaar Toevoegen
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Datum
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
              Ruimte (optioneel)
            </label>
            <select
              id="room"
              value={selectedRoomId || ""}
              onChange={(e) => setSelectedRoomId(e.target.value as Id<"rooms"> || null)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle ruimtes</option>
              {rooms?.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Unavailability List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Niet Beschikbaar {selectedDate && `voor ${new Date(selectedDate).toLocaleDateString('nl-NL')}`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruimte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tijd
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unavailability?.map((item) => {
                const room = rooms?.find(r => r._id === item.roomId);
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: room?.color || "#3B82F6" }}
                        ></div>
                        <div className="text-sm font-medium text-gray-900">
                          {room?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.date).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.startTime} - {item.endTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.reason || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {unavailability?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Geen niet-beschikbaarheid gevonden voor de geselecteerde filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Niet Beschikbaar Toevoegen
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                    Ruimte *
                  </label>
                  <select
                    id="roomId"
                    required
                    value={formData.roomId}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecteer ruimte</option>
                    {rooms?.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Start tijd *
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Eind tijd *
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reden
                  </label>
                  <input
                    type="text"
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Onderhoud, schoonmaak, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Toevoegen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView({ selectedDate, setSelectedDate }: { 
  selectedDate: string; 
  setSelectedDate: (date: string) => void; 
}) {
  const rooms = useQuery(api.roomReservations.getRooms);
  const reservations = useQuery(
    api.roomReservations.getReservations,
    selectedDate ? { date: selectedDate } : {}
  );

  // Generate time slots from 8:00 to 22:00
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getReservationForSlot = (roomId: Id<"rooms">, timeSlot: string) => {
    return reservations?.find(res => {
      if (res.roomId !== roomId) return false;
      const startHour = parseInt(res.startTime.split(':')[0]);
      const endHour = parseInt(res.endTime.split(':')[0]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kalender Overzicht</h1>
          <p className="text-gray-600">Overzicht van alle reserveringen per ruimte</p>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Datum
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Tijd
                </th>
                {rooms?.map((room) => (
                  <th key={room._id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: room.color }}
                      ></div>
                      <span>{room.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {timeSlot}
                  </td>
                  {rooms?.map((room) => {
                    const reservation = getReservationForSlot(room._id, timeSlot);
                    return (
                      <td key={room._id} className="px-6 py-4">
                        {reservation ? (
                          <div className="bg-blue-100 border border-blue-200 rounded-md p-2">
                            <div className="text-sm font-medium text-blue-900">
                              {reservation.customerName}
                            </div>
                            {reservation.purpose && (
                              <div className="text-xs text-blue-700 mt-1">
                                {reservation.purpose}
                              </div>
                            )}
                            <div className="text-xs text-blue-600 mt-1">
                              {reservation.startTime} - {reservation.endTime}
                            </div>
                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
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
                        ) : (
                          <div className="text-center text-gray-400 text-sm">
                            Beschikbaar
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
