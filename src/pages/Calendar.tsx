import Calendar from "../components/calender/Calendar";
import { SessionEvent } from "../components/calender/types";

export default function CalendarPage() {
  const sampleEvents: SessionEvent[] = [
    {
      id: "1",
      title: "Math Session - John",
      start: "2025-12-10T10:00:00",
      end: "2025-12-10T11:00:00"
    },
    {
      id: "2",
      title: "AI Class - Darpan",
      start: "2025-12-12T14:00:00",
      end: "2025-12-12T15:30:00"
    }
  ];

  return <Calendar events={sampleEvents} />;
}
