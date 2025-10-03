import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Escape special characters in iCalendar text
const escapeText = (text: string) => {
  return text.replace(/\\/g, '\\\\')
             .replace(/;/g, '\\;')
             .replace(/,/g, '\\,')
             .replace(/\n/g, '\\n')
             .replace(/\r/g, '');
};

// iCalendar feed for teacher workshops
http.route({
  path: "/api/calendar",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    
    console.log("Calendar request with token:", token);
    
    if (!token) {
      return new Response("Missing token parameter", { status: 400 });
    }

    try {
      // Get teacher by token
      const teacher = await ctx.runQuery(api.teachers.getTeacherByCalendarToken, { token });
      
      console.log("Found teacher:", teacher ? teacher.name : "none");
      
      if (!teacher) {
        return new Response("Invalid token", { status: 404 });
      }

      // Get workshops for this teacher
      const workshops = await ctx.runQuery(api.workshops.getWorkshopsByTeacher, {
        teacherId: teacher._id,
      });

      console.log("Workshops for calendar:", workshops.length);

      // Generate iCalendar content
      const icalContent = generateICalendar(teacher, workshops);

      return new Response(icalContent, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${teacher.name.replace(/[^a-zA-Z0-9]/g, '_')}_workshops.ics"`,
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
          "ETag": `"${Date.now()}-${workshops.length}"`,
          "Last-Modified": new Date().toUTCString(),
        },
      });
    } catch (error) {
      console.error("Calendar generation error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

function generateICalendar(teacher: any, workshops: any[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Workshop Calendar//Workshop Calendar//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(teacher.name)} - Workshops`,
    `X-WR-CALDESC:Workshop kalender voor ${escapeText(teacher.name)}`,
    'X-WR-TIMEZONE:Europe/Brussels',
    `X-PUBLISHED-TTL:PT15M`, // Refresh every 15 minutes
    // Add timezone definition for proper local time handling
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Brussels',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  workshops.forEach((workshop) => {
    const workshopDate = new Date(workshop.datum);
    const [startHour, startMinute] = workshop.startUur.split(':').map(Number);
    const [endHour, endMinute] = workshop.eindUur.split(':').map(Number);
    
    // Create local time dates
    const startDateTime = new Date(workshopDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(workshopDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
    
    // Format as local time with timezone
    const formatLocalDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    const uid = `workshop-${workshop._id}@workshop-calendar.local`;
    const summary = `Workshop: ${workshop.naamSchool}`;
    
    // Use workshop creation time for last modified
    const lastModified = workshop._creationTime ? new Date(workshop._creationTime) : now;
    const lastModifiedStr = lastModified.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    // Generate sequence number based on workshop data for change detection
    const dataString = JSON.stringify({
      school: workshop.naamSchool,
      teacher: workshop.naamLeerkracht,
      date: workshop.datum,
      start: workshop.startUur,
      end: workshop.eindUur,
      type: workshop.type,
      extra: workshop.extra,
      notes: workshop.opmerking,
      status: workshop.factuurStatus
    });
    
    // Simple hash for sequence number
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const sequence = Math.abs(hash) % 1000;
    
    const description = escapeText([
      `School: ${workshop.naamSchool}`,
      `Leerkracht: ${workshop.naamLeerkracht}`,
      `Type: ${workshop.type}`,
      workshop.extra ? `Extra: ${workshop.extra}` : '',
      workshop.opmerking ? `Opmerking: ${workshop.opmerking}` : '',
      workshop.factuurStatus ? `Factuur: ${workshop.factuurStatus}` : '',
    ].filter(Boolean).join('\n'));

    ical.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;TZID=Europe/Brussels:${formatLocalDateTime(startDateTime)}`,
      `DTEND;TZID=Europe/Brussels:${formatLocalDateTime(endDateTime)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${escapeText(workshop.naamSchool)}`,
      `STATUS:CONFIRMED`,
      'TRANSP:OPAQUE',
      `SEQUENCE:${sequence}`,
      `LAST-MODIFIED:${lastModifiedStr}`,
      'END:VEVENT'
    );
  });

  ical.push('END:VCALENDAR');
  
  return ical.join('\r\n');
}

export default http;
