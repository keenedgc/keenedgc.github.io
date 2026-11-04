import type { CollectionEntry } from 'astro:content';

export interface CalendarEvent {
  title: string;
  start: string;
  url: string;
  backgroundColor: string;
  borderColor: string;
  textColor?: string;
  tentative?: boolean;
}

const ONE_OFF_COLOR = '#FF4B33';
const LEAGUE_COLOR = '#556B2F';
const ONE_OFF_TENTATIVE_BG = 'rgba(165, 42, 42, 0.14)';
const ONE_OFF_TENTATIVE_BORDER = '#A52A2A';
const LEAGUE_TENTATIVE_BG = 'rgba(85, 107, 47, 0.16)';
const LEAGUE_TENTATIVE_BORDER = '#3F5321';

function calendarColorProps(baseType: 'league' | 'oneOff', tentative?: boolean): Pick<CalendarEvent, 'backgroundColor' | 'borderColor' | 'textColor'> {
  if (!tentative) {
    if (baseType === 'league') {
      return { backgroundColor: LEAGUE_COLOR, borderColor: LEAGUE_COLOR };
    }
    return { backgroundColor: ONE_OFF_COLOR, borderColor: ONE_OFF_COLOR };
  }

  if (baseType === 'league') {
    return {
      backgroundColor: LEAGUE_TENTATIVE_BG,
      borderColor: LEAGUE_TENTATIVE_BORDER,
      textColor: LEAGUE_TENTATIVE_BORDER
    };
  }

  return {
    backgroundColor: ONE_OFF_TENTATIVE_BG,
    borderColor: ONE_OFF_TENTATIVE_BORDER,
    textColor: ONE_OFF_TENTATIVE_BORDER
  };
}

const WEEKDAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(date: Date, months: number): Date {
  const value = new Date(date);
  value.setMonth(value.getMonth() + months);
  return value;
}

function parseWeekdayIndex(value?: string): number | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  for (const [key, index] of Object.entries(WEEKDAY_INDEX)) {
    if (normalized.includes(key)) return index;
  }

  return null;
}

function firstWeekdayOnOrAfter(start: Date, weekday: number): Date {
  const first = startOfLocalDay(start);
  const offset = (weekday - first.getDay() + 7) % 7;
  first.setDate(first.getDate() + offset);
  return first;
}

function toRecurringLeagueEvents(event: CollectionEntry<'events'>): CalendarEvent[] {
  const weekdayText = event.data.weekday ?? event.data.day;
  const weekday = parseWeekdayIndex(weekdayText);
  if (weekday === null) {
    return [
      {
        title: event.data.title,
        start: toDateOnlyString(event.data.date),
        url: `/events/${event.id}/`,
        ...calendarColorProps('league', event.data.tentative),
        tentative: event.data.tentative
      }
    ];
  }

  const today = startOfLocalDay(new Date());
  const rangeStart = event.data.season_start ? startOfLocalDay(event.data.season_start) : today;
  const rangeEnd = event.data.season_end
    ? startOfLocalDay(event.data.season_end)
    : startOfLocalDay(addMonths(today, 6));

  if (rangeEnd < rangeStart) return [];

  const url = `/events/${event.id}/`;
  const occurrences: CalendarEvent[] = [];

  let occurrence = firstWeekdayOnOrAfter(rangeStart, weekday);
  while (occurrence <= rangeEnd) {
    occurrences.push({
      title: event.data.title,
      start: toDateOnlyString(occurrence),
      url,
      ...calendarColorProps('league', event.data.tentative),
      tentative: event.data.tentative
    });

    occurrence = new Date(occurrence);
    occurrence.setDate(occurrence.getDate() + 7);
  }

  return occurrences;
}

function toOneOffEvent(event: CollectionEntry<'events'>): CalendarEvent {
  return {
    title: event.data.title,
    start: toDateOnlyString(event.data.date),
    url: `/events/${event.id}/`,
    ...calendarColorProps('oneOff', event.data.tentative),
    tentative: event.data.tentative
  };
}

export function toCalendarEvents(events: CollectionEntry<'events'>[]): CalendarEvent[] {
  const calendarEvents: CalendarEvent[] = [];

  for (const event of events) {
    if (event.data.event_type === 'League') {
      calendarEvents.push(...toRecurringLeagueEvents(event));
      continue;
    }

    calendarEvents.push(toOneOffEvent(event));
  }

  return calendarEvents.sort((a, b) => a.start.localeCompare(b.start));
}
