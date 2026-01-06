import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import type { Session } from '../types/session';

interface CalendarProps {
  sessions: Session[];
  onEventClick?: (session: Session) => void;
  onDateSelect?: (selectInfo: DateSelectArg) => void;
  currentUserId?: number;
}

const Calendar: React.FC<CalendarProps> = ({ sessions, onEventClick, onDateSelect, currentUserId }) => {
  // Helper function to get day of week number (0 = Sunday, 1 = Monday, etc.)
  const getDayOfWeekNumber = (dayName: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  // Helper function to generate recurring events for a session
  const generateRecurringEvents = (session: Session) => {
    const events = [];
    const startDate = new Date(session.startDate);
    const endDate = new Date(session.endDate);
    const targetDayOfWeek = getDayOfWeekNumber(session.dayOfWeek);

    // Find the first occurrence of the target day of week
    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== targetDayOfWeek && currentDate <= endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate events for each occurrence
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Get staff names for display
      const staffNames = session.staff && session.staff.length > 0
        ? session.staff.map(s => s.userName).join(', ')
        : '';
      
      // Check if current user is assigned to this session
      const isAssignedToUser = currentUserId && session.staff?.some(s => s.id === currentUserId);

      events.push({
        id: `${session.id}-${dateStr}`,
        title: session.title,
        start: `${dateStr}T${session.startTime}`,
        end: `${dateStr}T${session.endTime}`,
        backgroundColor: isAssignedToUser ? '#6AA469' : '#FFFFFF', // Green if assigned, white otherwise
        borderColor: isAssignedToUser ? '#6AA469' : '#D1D5DB',
        textColor: isAssignedToUser ? '#FFFFFF' : '#374151',
        classNames: isAssignedToUser ? ['assigned-session'] : ['unassigned-session'],
        extendedProps: {
          location: session.location,
          city: session.city,
          capacity: session.capacity,
          term: session.term,
          dayOfWeek: session.dayOfWeek,
          staff: session.staff,
          staffNames: staffNames,
          minAge: session.minAge,
          maxAge: session.maxAge,
          sessionData: session,
        },
      });

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return events;
  };

  // Convert sessions to FullCalendar events with recurring instances
  const events = sessions.flatMap((session) => generateRecurringEvents(session));

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (onEventClick) {
      const sessionData = clickInfo.event.extendedProps.sessionData as Session;
      onEventClick(sessionData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <style>
        {`
          /* Tuhura Tech Calendar Styling */
          .fc {
            font-family: system-ui, -apple-system, sans-serif;
          }
          
          .fc .fc-button-primary {
            background-color: #6AA469 !important;
            border-color: #6AA469 !important;
            color: white !important;
          }
          
          .fc .fc-button-primary:hover {
            background-color: #5B9359 !important;
            border-color: #5B9359 !important;
          }
          
          .fc .fc-button-primary:disabled {
            background-color: #6C757D !important;
            border-color: #6C757D !important;
            opacity: 0.6;
          }
          
          .fc .fc-button-active {
            background-color: #1E6193 !important;
            border-color: #1E6193 !important;
          }
          
          .fc-theme-standard .fc-scrollgrid {
            border-color: #E5E7EB !important;
          }
          
          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: #E5E7EB !important;
          }
          
          .fc-col-header-cell {
            background-color: #F3F4F6;
            font-weight: 600;
            color: #003554;
            padding: 12px 8px;
          }
          
          .fc-daygrid-day-number {
            color: #003554;
            font-weight: 500;
            padding: 8px;
          }
          
          .fc-day-today {
            background-color: #F0F9FF !important;
          }
          
          .fc-event {
            cursor: pointer;
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 0.75rem;
            font-weight: 500;
            line-height: 1.2;
          }
          
          .fc-event-title {
            white-space: normal !important;
            overflow: visible !important;
          }
          
          .fc-event:hover {
            opacity: 0.85;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .fc-toolbar-title {
            color: #003554;
            font-size: 1.5rem;
            font-weight: 700;
          }
          
          .fc-timegrid-slot-label {
            color: #6C757D;
            font-size: 0.875rem;
          }
          
          .fc-timegrid-now-indicator-line {
            border-color: #00A8E8 !important;
            border-width: 2px !important;
          }
          
          .fc-timegrid-now-indicator-arrow {
            border-color: #00A8E8 !important;
          }
          
          /* Assigned session styling */
          .assigned-session {
            background-color: #6AA469 !important;
            border-color: #6AA469 !important;
            color: #FFFFFF !important;
          }
          
          /* Unassigned session styling */
          .unassigned-session {
            background-color: #FFFFFF !important;
            border-color: #D1D5DB !important;
            color: #374151 !important;
          }
          
          .unassigned-session .fc-event-time,
          .unassigned-session .fc-event-title {
            color: #374151 !important;
          }
          
          .assigned-session .fc-event-time,
          .assigned-session .fc-event-title {
            color: #FFFFFF !important;
          }
        `}
      </style>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={handleEventClick}
        select={onDateSelect}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        nowIndicator={true}
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }}
        eventContent={(eventInfo) => {
          const staffNames = eventInfo.event.extendedProps.staffNames;
          return (
            <div className="fc-event-main-frame" style={{ padding: '2px 4px' }}>
              <div className="fc-event-time">{eventInfo.timeText}</div>
              <div className="fc-event-title-container">
                <div className="fc-event-title" style={{ fontWeight: 600 }}>
                  {eventInfo.event.title}
                </div>
                {staffNames && (
                  <div style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '2px' }}>
                    👤 {staffNames}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default Calendar;
