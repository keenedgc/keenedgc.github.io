import FullCalendar from '@fullcalendar/react';
import type { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';

import type { CalendarEvent } from '../utils/calendarEvents';

interface Props {
  events: CalendarEvent[];
  compact?: boolean;
}

export default function EventCalendar({ events, compact = false }: Props) {
  const handleEventClick = (info: EventClickArg) => {
    info.jsEvent.preventDefault();
    if (info.event.url) {
      window.location.href = info.event.url;
    }
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, listPlugin]}
      initialView="dayGridMonth"
      events={events}
      eventClassNames={(arg) => (arg.event.extendedProps?.tentative ? ['fc-event-tentative'] : [])}
      eventContent={(arg) => {
        const tentative = Boolean(arg.event.extendedProps?.tentative);
        return (
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1">
              {tentative && (
                <span
                  className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white/85 text-[9px] font-semibold leading-none text-keene-crimson"
                  title="Tentative"
                  aria-label="Tentative"
                >
                  ?
                </span>
              )}
              <div className="min-w-0 truncate">{arg.event.title}</div>
            </div>
          </div>
        );
      }}
      height={compact ? 'auto' : undefined}
      contentHeight={compact ? 350 : undefined}
      fixedWeekCount={false}
      dayMaxEventRows={compact ? 2 : true}
      buttonText={{ today: 'Today', month: 'Month', listMonth: 'List' }}
      headerToolbar={
        compact
          ? { left: 'prev', center: 'title', right: 'next' }
          : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }
      }
      eventClick={handleEventClick}
    />
  );
}
