import type { CollectionEntry } from 'astro:content';

// Leagues stay upcoming through season_end; other events through the end of their date.
export function isEventUpcoming(event: CollectionEntry<'events'>, now: Date = new Date()): boolean {
  if (event.data.event_type === 'League') {
    return !event.data.season_end || event.data.season_end >= now;
  }
  return event.data.date >= new Date(now.toDateString());
}
