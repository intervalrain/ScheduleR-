"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    // Placeholder for fetching calendar events from API
    const fetchedEvents: CalendarEvent[] = [
      { id: "1", title: "Meeting", start: new Date(), end: new Date() },
    ];
    setEvents(fetchedEvents);
  }, []);

  const handleSelectEvent = (event: CalendarEvent) => {
    alert(event.title);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt("New Event name");
    if (title) {
      const newEvent: CalendarEvent = {
        id: String(events.length + 1),
        title,
        start,
        end,
      };
      setEvents([...events, newEvent]);
      // Placeholder for creating event via API
      // fetch("/api/calendar", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(newEvent),
      // });
    }
  };

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <div style={{ height: 700 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}