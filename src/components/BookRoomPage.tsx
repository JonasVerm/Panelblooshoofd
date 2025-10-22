import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface TimeSlot {
  hour: number;
  time: string;
  available: boolean;
  reservation?: {
    id: string;
    customerName: string;
    purpose?: string;
  };
}

export function BookRoomPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    purpose: "",
    notes: "",
    endTime: "",
  });

  const rooms = useQuery(api.roomReservations.getRooms);
  const availability = useQuery(
    api.roomReservations.getRoomAvailability,
    selectedRoomId && selectedDate
      ? { roomId: selectedRoomId, date: selectedDate }
      : "skip"
  );

  const createReservation = useMutation(api.roomReservations.createReservation);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Generate time slots from 8:00 to 22:00
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isAvailable = availability ? !availability.some(
        res => {
          const startHour = parseInt(res.startTime.split(':')[0]);
          const endHour = parseInt(res.endTime.split(':')[0]);
          return hour >= startHour && hour < endHour;
        }
      ) : true;

      const reservation = availability?.find(res => {
        const startHour = parseInt(res.startTime.split(':')[0]);
        const endHour = parseInt(res.endTime.split(':')[0]);
        return hour >= startHour && hour < endHour;
      });

      slots.push({
        hour,
        time,
        available: isAvailable,
        reservation: reservation ? {
          id: reservation._id,
          customerName: reservation.customerName,
          purpose: reservation.purpose,
        } : undefined,
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleTimeSlotClick = (timeSlot: TimeSlot) => {
    if (!timeSlot.available) return;
    
    setSelectedTimeSlot(timeSlot.time);
    setBookingData(prev => ({
      ...prev,
      endTime: `${(timeSlot.hour + 1).toString().padStart(2, '0')}:00`,
    }));
    setShowBookingForm(true);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoomId || !selectedDate || !selectedTimeSlot) {
      toast.error("Selecteer een ruimte, datum en tijdslot");
      return;
    }

    if (!bookingData.customerName.trim()) {
      toast.error("Naam is verplicht");
      return;
    }

    try {
      await createReservation({
        roomId: selectedRoomId,
        customerName: bookingData.customerName.trim(),
        customerEmail: bookingData.customerEmail.trim() || undefined,
        customerPhone: bookingData.customerPhone.trim() || undefined,
        date: selectedDate,
        startTime: selectedTimeSlot,
        endTime: bookingData.endTime,
        purpose: bookingData.purpose.trim() || undefined,
        notes: bookingData.notes.trim() || undefined,
      });

      toast.success("Reservering succesvol aangemaakt!");
      
      // Reset form
      setShowBookingForm(false);
      setSelectedTimeSlot(null);
      setBookingData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        purpose: "",
        notes: "",
        endTime: "",
      });
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error("Er is een fout opgetreden bij het maken van de reservering");
    }
  };

  const selectedRoom = rooms?.find(room => room._id === selectedRoomId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ruimte Reserveren</h1>
        <p className="text-gray-600">Selecteer een ruimte en datum om beschikbaarheid te bekijken</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Room Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecteer Ruimte</h2>
            
            <div className="space-y-3">
              {rooms?.map((room) => (
                <button
                  key={room._id}
                  onClick={() => setSelectedRoomId(room._id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedRoomId === room._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-gray-900">{room.name}</div>
                  {room.description && (
                    <div className="text-sm text-gray-600 mt-1">{room.description}</div>
                  )}
                  {room.capacity && (
                    <div className="text-sm text-gray-500 mt-1">
                      Capaciteit: {room.capacity} personen
                    </div>
                  )}
                  {room.equipment && room.equipment.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      Uitrusting: {room.equipment.join(", ")}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedRoom && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Geselecteerde Ruimte</h3>
                <div className="text-blue-800">
                  <div className="font-medium">{selectedRoom.name}</div>
                  {selectedRoom.description && (
                    <div className="text-sm mt-1">{selectedRoom.description}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date Selection and Availability */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Beschikbaarheid</h2>
              
              <div className="flex items-center space-x-4">
                <label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Datum:
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {!selectedRoomId ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p>Selecteer eerst een ruimte om beschikbaarheid te bekijken</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeSlotClick(slot)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      slot.available
                        ? "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                        : "bg-red-100 text-red-800 cursor-not-allowed"
                    }`}
                    title={
                      slot.available
                        ? `Beschikbaar om ${slot.time}`
                        : `Gereserveerd door ${slot.reservation?.customerName}${
                            slot.reservation?.purpose ? ` - ${slot.reservation.purpose}` : ""
                          }`
                    }
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span className="text-gray-600">Beschikbaar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span className="text-gray-600">Bezet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Reservering Maken</h3>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div><strong>Ruimte:</strong> {selectedRoom?.name}</div>
                  <div><strong>Datum:</strong> {new Date(selectedDate).toLocaleDateString('nl-NL')}</div>
                  <div><strong>Tijd:</strong> {selectedTimeSlot} - {bookingData.endTime}</div>
                </div>
              </div>

              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    required
                    value={bookingData.customerName}
                    onChange={(e) => setBookingData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    value={bookingData.customerEmail}
                    onChange={(e) => setBookingData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Gsm
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    value={bookingData.customerPhone}
                    onChange={(e) => setBookingData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Eindtijd
                  </label>
                  <select
                    id="endTime"
                    value={bookingData.endTime}
                    onChange={(e) => setBookingData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {selectedTimeSlot && Array.from({ length: 23 - parseInt(selectedTimeSlot.split(':')[0]) }, (_, i) => {
                      const hour = parseInt(selectedTimeSlot.split(':')[0]) + i + 1;
                      const time = `${hour.toString().padStart(2, '0')}:00`;
                      return (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                    Reden van reservatie
                  </label>
                  <input
                    type="text"
                    id="purpose"
                    value={bookingData.purpose}
                    onChange={(e) => setBookingData(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Opname, proefshow, podcast ..."
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Opmerkingen
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Extra informatie..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Reserveren
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
