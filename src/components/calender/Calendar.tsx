import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { SessionEvent } from "./types";

interface CalendarProps {
  events: SessionEvent[];
}

export default function Calendar({ events }: CalendarProps) {
  return (
    <div style={{ padding: "1rem" }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}
        events={events}
        nowIndicator={true}
        height="auto"
      />
    </div>
  );
}
