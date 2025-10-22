import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Public room booking endpoint - shows all available rooms
http.route({
  path: "/book-room",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    
    // Get all rooms for the public booking interface
    const rooms = await ctx.runQuery(api.roomReservations.getRooms, {});
    
    // Simple HTML page for public room booking
    const html = `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ruimte Reserveren</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
      <div class="min-h-screen py-12">
        <div class="max-w-4xl mx-auto px-4">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Ruimte Reserveren</h1>
            <p class="text-gray-600">Selecteer een ruimte en maak een reservering</p>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Beschikbare Ruimtes</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${rooms.map((room: any) => `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div class="flex items-center space-x-3 mb-2">
                    <div class="w-4 h-4 rounded-full" style="background-color: ${room.color || '#3B82F6'}"></div>
                    <h3 class="font-medium text-gray-900">${room.name}</h3>
                  </div>
                  ${room.description ? `<p class="text-sm text-gray-600 mb-2">${room.description}</p>` : ''}
                  ${room.capacity ? `<p class="text-sm text-gray-500 mb-2">Capaciteit: ${room.capacity} personen</p>` : ''}
                  ${room.equipment && room.equipment.length > 0 ? `<p class="text-sm text-gray-500 mb-3">Uitrusting: ${room.equipment.join(', ')}</p>` : ''}
                  <button 
                    onclick="window.location.href = window.location.origin + '/room-booking?room=${room._id}'"
                    class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Reserveren
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="mt-8 text-center">
            <p class="text-gray-600">
              Voor vragen of hulp bij het reserveren, neem contact op via email of telefoon.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }),
});

// Room booking form endpoint
http.route({
  path: "/room-booking",
  method: "GET", 
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const roomId = url.searchParams.get("room");
    
    if (!roomId) {
      return new Response("Room ID required", { status: 400 });
    }
    
    const rooms = await ctx.runQuery(api.roomReservations.getRooms, {});
    const room = rooms.find((r: any) => r._id === roomId);
    
    if (!room) {
      return new Response("Room not found", { status: 404 });
    }
    
    const html = `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reservering maken - ${room.name}</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50">
      <div class="min-h-screen py-12">
        <div class="max-w-2xl mx-auto px-4">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Reservering maken</h1>
            <div class="flex items-center justify-center space-x-2 text-gray-600">
              <div class="w-4 h-4 rounded-full" style="background-color: ${room.color || '#3B82F6'}"></div>
              <span>Ruimte: ${room.name}</span>
            </div>
            ${room.description ? `<p class="text-gray-500 mt-1">${room.description}</p>` : ''}
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <div id="availabilitySection" class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Selecteer Datum en Tijd</h3>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
                <input type="date" id="selectedDate" min="${new Date().toISOString().split('T')[0]}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       onchange="loadAvailability()">
              </div>
              
              <div id="timeSlotsContainer" class="hidden">
                <label class="block text-sm font-medium text-gray-700 mb-2">Beschikbare tijdsloten</label>
                <div id="timeSlots" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4"></div>
              </div>
            </div>

            <form id="bookingForm" class="space-y-4" style="display: none;">
              <input type="hidden" name="roomId" value="${roomId}">
              <input type="hidden" id="selectedTimeSlot" name="startTime">
              <input type="hidden" id="selectedDate2" name="date">
              
              <div id="selectedSlotInfo" class="bg-blue-50 p-4 rounded-lg mb-4"></div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                <input type="text" name="customerName" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Uw naam">
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="customerEmail"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="uw.email@example.com">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                  <input type="tel" name="customerPhone"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="06 12345678">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Eind tijd *</label>
                <select name="endTime" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Doel van de reservering</label>
                <input type="text" name="purpose"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Vergadering, training, etc.">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Opmerkingen</label>
                <textarea name="notes" rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Eventuele opmerkingen"></textarea>
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="resetForm()"
                        class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                  Opnieuw
                </button>
                <button type="submit"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Reservering Maken
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <script>
        let selectedSlot = null;
        let availability = [];
        
        // Set today as default date
        document.getElementById('selectedDate').value = new Date().toISOString().split('T')[0];
        loadAvailability();
        
        async function loadAvailability() {
          const date = document.getElementById('selectedDate').value;
          if (!date) return;
          
          try {
            const response = await fetch('/room-availability?room=${roomId}&date=' + date);
            availability = await response.json();
            renderTimeSlots();
          } catch (error) {
            console.error('Error loading availability:', error);
          }
        }
        
        function renderTimeSlots() {
          const container = document.getElementById('timeSlots');
          const timeSlotsContainer = document.getElementById('timeSlotsContainer');
          
          container.innerHTML = '';
          
          // Generate time slots from 8:00 to 22:00
          for (let hour = 8; hour <= 22; hour++) {
            const time = hour.toString().padStart(2, '0') + ':00';
            const isAvailable = !availability.some(res => {
              const startHour = parseInt(res.startTime.split(':')[0]);
              const endHour = parseInt(res.endTime.split(':')[0]);
              return hour >= startHour && hour < endHour;
            });
            
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = time;
            button.className = \`p-3 rounded-lg text-sm font-medium transition-all \${
              isAvailable
                ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                : 'bg-red-100 text-red-800 cursor-not-allowed'
            }\`;
            
            if (isAvailable) {
              button.onclick = () => selectTimeSlot(time, hour);
            } else {
              const reservation = availability.find(res => {
                const startHour = parseInt(res.startTime.split(':')[0]);
                const endHour = parseInt(res.endTime.split(':')[0]);
                return hour >= startHour && hour < endHour;
              });
              button.title = \`Gereserveerd door \${reservation?.customerName || 'Onbekend'}\`;
            }
            
            container.appendChild(button);
          }
          
          timeSlotsContainer.classList.remove('hidden');
        }
        
        function selectTimeSlot(time, hour) {
          selectedSlot = { time, hour };
          
          // Update form
          document.getElementById('selectedTimeSlot').value = time;
          document.getElementById('selectedDate2').value = document.getElementById('selectedDate').value;
          
          // Update end time options
          const endTimeSelect = document.querySelector('select[name="endTime"]');
          endTimeSelect.innerHTML = '';
          
          for (let endHour = hour + 1; endHour <= 23; endHour++) {
            const endTime = endHour.toString().padStart(2, '0') + ':00';
            const option = document.createElement('option');
            option.value = endTime;
            option.textContent = endTime;
            if (endHour === hour + 1) option.selected = true;
            endTimeSelect.appendChild(option);
          }
          
          // Show selected slot info
          const selectedDate = new Date(document.getElementById('selectedDate').value);
          document.getElementById('selectedSlotInfo').innerHTML = \`
            <div class="text-sm text-blue-800">
              <div><strong>Ruimte:</strong> ${room.name}</div>
              <div><strong>Datum:</strong> \${selectedDate.toLocaleDateString('nl-NL')}</div>
              <div><strong>Start tijd:</strong> \${time}</div>
            </div>
          \`;
          
          // Show booking form
          document.getElementById('bookingForm').style.display = 'block';
          document.getElementById('bookingForm').scrollIntoView({ behavior: 'smooth' });
        }
        
        function resetForm() {
          document.getElementById('bookingForm').style.display = 'none';
          selectedSlot = null;
          document.getElementById('bookingForm').reset();
        }
        
        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const data = Object.fromEntries(formData.entries());
          
          try {
            const response = await fetch('/room-booking', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            if (response.ok) {
              alert('Reservering succesvol gemaakt!');
              window.location.href = '/book-room';
            } else {
              const error = await response.text();
              alert('Fout: ' + error);
            }
          } catch (error) {
            alert('Er is een fout opgetreden: ' + error.message);
          }
        });
      </script>
    </body>
    </html>
    `;
    
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }),
});

// Get room availability endpoint
http.route({
  path: "/room-availability",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const roomId = url.searchParams.get("room");
    const date = url.searchParams.get("date");
    
    if (!roomId || !date) {
      return new Response("Room ID and date required", { status: 400 });
    }
    
    try {
      const availability = await ctx.runQuery(api.roomReservations.getRoomAvailability, {
        roomId: roomId as any,
        date: date,
      });
      
      return new Response(JSON.stringify(availability), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(error.message || "Error fetching availability", { status: 400 });
    }
  }),
});

// Handle room booking form submission
http.route({
  path: "/room-booking",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const data = await request.json();
      
      await ctx.runMutation(api.roomReservations.createReservation, {
        roomId: data.roomId,
        customerName: data.customerName,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone || undefined,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        purpose: data.purpose || undefined,
        notes: data.notes || undefined,
      });
      
      return new Response("Reservering succesvol gemaakt!", { status: 200 });
    } catch (error: any) {
      return new Response(error.message || "Fout bij maken reservering", { status: 400 });
    }
  }),
});

export default http;
