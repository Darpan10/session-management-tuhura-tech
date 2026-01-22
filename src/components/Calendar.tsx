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
  // Color palette for different sessions
  const sessionColors = [
    { bg: '#6AA469', border: '#5A8F59', text: '#FFFFFF' }, // Green
    { bg: '#00A8E8', border: '#0088BB', text: '#FFFFFF' }, // Blue
    { bg: '#9B59B6', border: '#7D3C98', text: '#FFFFFF' }, // Purple
    { bg: '#E67E22', border: '#CA6F1E', text: '#FFFFFF' }, // Orange
    { bg: '#16A085', border: '#138D75', text: '#FFFFFF' }, // Teal
    { bg: '#E74C3C', border: '#C0392B', text: '#FFFFFF' }, // Red
    { bg: '#F39C12', border: '#D68910', text: '#FFFFFF' }, // Yellow
    { bg: '#3498DB', border: '#2980B9', text: '#FFFFFF' }, // Light Blue
    { bg: '#8E44AD', border: '#703688', text: '#FFFFFF' }, // Dark Purple
    { bg: '#27AE60', border: '#229954', text: '#FFFFFF' }, // Emerald
  ];

  // Get color for a session based on its ID
  const getSessionColor = (sessionId: number, isAssigned: boolean) => {
    if (isAssigned) {
      return sessionColors[0]; // Green for assigned sessions
    }
    // Use session ID to consistently assign colors
    const colorIndex = (sessionId - 1) % sessionColors.length;
    return sessionColors[colorIndex];
  };

  // Helper function to get day of week number (0 = Sunday, 1 = Monday, etc.)
  const getDayOfWeekNumber = (dayName: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  // Helper function to generate recurring events for a session
  const generateRecurringEvents = (session: Session) => {
    const events: any[] = [];
    const targetDayOfWeek = getDayOfWeekNumber(session.dayOfWeek);

    // Generate events for each term in the session
    session.terms.forEach(term => {
      const termStart = new Date(term.startDate);
      const termEnd = new Date(term.endDate);
      
      // Find the first occurrence of the target day of week in this term
      let currentDate = new Date(termStart);
      while (currentDate.getDay() !== targetDayOfWeek && currentDate <= termEnd) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate events for each occurrence within this term
      while (currentDate <= termEnd) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Get staff names for display
        const staffNames = session.staff && session.staff.length > 0
          ? session.staff.map(s => s.userName).join(', ')
          : '';
        
        // Check if current user is assigned to this session
        const isAssignedToUser = currentUserId && session.staff?.some(s => s.id === currentUserId);
        
        // Get color scheme for this session
        const colors = getSessionColor(session.id, isAssignedToUser || false);

        events.push({
          id: `${session.id}-${dateStr}`,
          title: session.title,
          start: `${dateStr}T${session.startTime}`,
          end: `${dateStr}T${session.endTime}`,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          classNames: isAssignedToUser ? ['assigned-session'] : ['unassigned-session'],
          extendedProps: {
            location: session.location,
            city: session.city,
            capacity: session.capacity,
            term: session.termNames?.join(', '),
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
    });

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

          /* Increase popover z-index */
          .fc-popover {
            z-index: 9998 !important;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
            min-width: 300px !important;
            max-width: 500px !important;
          }

          .fc-popover-header {
            background: linear-gradient(135deg, #00A8E8 0%, #0088BB 100%) !important;
            color: white !important;
            padding: 12px 16px !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
          }

          .fc-popover-body {
            padding: 8px !important;
            max-height: 400px !important;
            overflow-y: auto !important;
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

          /* Distinct session colors for better differentiation */
          .fc-event {
            border-width: 2px !important;
            border-left-width: 5px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
          }

          /* Month view improvements */
          .fc-daygrid-event {
            margin-bottom: 2px !important;
            border-radius: 4px !important;
            padding: 3px 6px !important;
          }

          /* Week/Day view improvements - consistent with month view */
          .fc-timegrid-event {
            border-radius: 4px !important;
            padding: 8px !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
            min-height: 55px !important;
            margin-bottom: 6px !important;
          }

          .fc-timegrid-event .fc-event-main {
            padding: 4px !important;
          }

          .fc-timegrid-event .fc-event-title {
            white-space: normal !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            overflow: visible !important;
            text-overflow: clip !important;
            line-height: 1.35 !important;
            font-size: 0.875rem !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            max-width: 100% !important;
          }

          .fc-timegrid-event .fc-event-time {
            display: none !important;
          }

          .fc-timegrid-event .fc-event-title-container {
            overflow: visible !important;
            white-space: normal !important;
          }

          /* Better spacing and visibility in all views */
          .fc-event-main {
            padding: 3px !important;
          }

          /* Enhanced borders for all views */
          .fc-timegrid-event-harness {
            margin-bottom: 2px !important;
          }

          /* More link styling - make it very prominent */
          .fc-daygrid-more-link,
          .fc-timegrid-more-link {
            background-color: #00A8E8 !important;
            color: #FFFFFF !important;
            font-weight: 700 !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            margin: 2px !important;
            display: inline-block !important;
            text-align: center !important;
            cursor: pointer !important;
            border: 2px solid #0088BB !important;
            box-shadow: 0 2px 4px rgba(0, 168, 232, 0.3) !important;
            transition: all 0.2s ease !important;
          }

          .fc-daygrid-more-link:hover,
          .fc-timegrid-more-link:hover {
            background-color: #0088BB !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 6px rgba(0, 168, 232, 0.4) !important;
          }

          /* Week view - position more link below events */
          .fc-timegrid-week .fc-timegrid-more-link {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            top: auto !important;
            margin: 4px !important;
            margin-top: 8px !important;
            z-index: 10 !important;
            display: block !important;
            width: auto !important;
            clear: both !important;
          }

          /* Ensure slot lane has proper spacing */
          .fc-timegrid-week .fc-timegrid-slot-lane {
            position: relative !important;
          }

          /* Events should have normal spacing, not extra margin */
          .fc-timegrid-week .fc-timegrid-event-harness {
            margin-bottom: 4px !important;
          }

          .fc-timegrid-more-link-inner {
            position: relative !important;
            z-index: 1 !important;
          }

          /* Remove min-height to let events size naturally */
          .fc-timegrid-slot-lane {
            position: relative !important;
          }

          /* Prevent event click on more link */
          .fc-daygrid-event-harness + .fc-daygrid-event-harness {
            pointer-events: auto !important;
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
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
        }}
        events={events}
        eventClick={handleEventClick}
        select={onDateSelect}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        dayMaxEventRows={3}
        moreLinkClick="popover"
        moreLinkClassNames={['more-link-custom']}
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
        views={{
          dayGridMonth: {
            dayMaxEvents: 3,
            moreLinkClick: 'popover',
          },
          timeGridWeek: {
            dayMaxEvents: 1,
            dayMaxEventRows: 1,
            moreLinkClick: 'popover',
            eventMaxStack: 1,
          },
          timeGridDay: {
            dayMaxEvents: 5,
            dayMaxEventRows: 5,
            moreLinkClick: 'popover',
            eventMinHeight: 50,
            eventMaxStack: 5,
          },
        }}
        eventContent={(eventInfo) => {
          const staffNames = eventInfo.event.extendedProps.staffNames;
          const isMonthView = eventInfo.view.type === 'dayGridMonth';
          const isDayView = eventInfo.view.type === 'timeGridDay';
          const isWeekView = eventInfo.view.type === 'timeGridWeek';
          
          return (
            <div className="fc-event-main-frame" style={{ padding: '4px', overflow: 'visible', height: '100%' }}>
              {!isWeekView && (
                <div className="fc-event-time" style={{ fontSize: isMonthView ? '0.7rem' : '0.75rem' }}>
                  {eventInfo.timeText}
                </div>
              )}
              <div className="fc-event-title-container" style={{ overflow: 'visible' }}>
                <div 
                  className="fc-event-title" 
                  style={{ 
                    fontWeight: 600, 
                    whiteSpace: (isDayView || isWeekView) ? 'normal' : 'nowrap',
                    overflow: (isDayView || isWeekView) ? 'visible' : 'hidden',
                    textOverflow: (isDayView || isWeekView) ? 'clip' : 'ellipsis',
                    wordBreak: (isDayView || isWeekView) ? 'break-word' : 'normal',
                    fontSize: isMonthView ? '0.75rem' : '0.875rem',
                  }}
                >
                  {eventInfo.event.title}
                </div>
                {staffNames && !isMonthView && !isWeekView && (
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
