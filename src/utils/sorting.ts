import { SportEvent } from '../types';
import { formatMatchDayFrench, getParisDateKey } from './date';

/**
 * Intelligent and strict chronological sorter for sports events.
 * 
 * Order of presentation:
 * 1. Live matches currently underway (ordered chronologically by kickoff)
 * 2. Today's scheduled matches (ordered strictly ascending by kickoff time: 14:00 before 18:00 before 20:45)
 * 3. Tomorrow's scheduled matches (ordered strictly ascending by kickoff time)
 * 4. Subsequent upcoming matches day-by-day in strictly ascending chronological order
 * 5. Finished matches (ordered descending by most recently completed)
 */
export function sortEventsIntelligently(events: SportEvent[]): SportEvent[] {
  const now = new Date();
  const todayKey = getParisDateKey(now);

  return [...events].sort((a, b) => {
    // 1. Group priority by status & date category
    const getGroupRank = (ev: SportEvent) => {
      if (ev.status === 'live') return 0; // Top priority: live matches
      if (ev.status === 'finished') return 4; // Bottom: finished results

      const time = new Date(ev.startTime).getTime();
      if (isNaN(time)) return 3;

      const evKey = getParisDateKey(ev.startTime);
      if (evKey === todayKey) return 1; // Today
      if (evKey > todayKey) return 2; // Tomorrow and future
      return 3;
    };

    const rankA = getGroupRank(a);
    const rankB = getGroupRank(b);
    if (rankA !== rankB) return rankA - rankB;

    // 2. Finished matches are sorted in reverse chronological order (most recent first)
    if (rankA === 4) {
      const timeA = new Date(a.finishedAt || a.startTime).getTime();
      const timeB = new Date(b.finishedAt || b.startTime).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA;
      }
    }

    // 3. For live, today and upcoming matches: STRICT ascending chronological order
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeA - timeB;
    }

    // 4. Secondary tie-breaker: competition name alphabetically
    const compDiff = (a.competition || '').localeCompare(b.competition || '', 'fr');
    if (compDiff !== 0) return compDiff;

    // 5. Tertiary tie-breaker: home team name alphabetically
    return (a.homeTeam || '').localeCompare(b.homeTeam || '', 'fr');
  });
}

/**
 * Sorts an array of events in strictly ascending chronological order (earliest kickoff first).
 */
export function sortEventsAscending(events: SportEvent[]): SportEvent[] {
  return [...events].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();

    if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeA - timeB;
    }

    // Tie-breaker: competition then home team
    const compDiff = (a.competition || '').localeCompare(b.competition || '', 'fr');
    if (compDiff !== 0) return compDiff;

    return (a.homeTeam || '').localeCompare(b.homeTeam || '', 'fr');
  });
}

export interface DateGroupedEvents {
  dateKey: string;
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  events: SportEvent[];
}

/**
 * Groups events by chronological day with formatted French headers.
 * Guaranteed:
 * - Uses French local time (Europe/Paris)
 * - Headers formatted like 'Aujourd\'hui', 'Demain', 'Lun 12 Oct'
 * - Within each day, matches are ordered by kickoff time ascending
 */
export function groupEventsByDay(events: SportEvent[]): DateGroupedEvents[] {
  const sorted = sortEventsAscending(events);
  const groups: DateGroupedEvents[] = [];
  const map = new Map<string, DateGroupedEvents>();

  for (const ev of sorted) {
    const d = new Date(ev.startTime);
    const dateKey = !isNaN(d.getTime()) ? getParisDateKey(d) : 'undetermined';

    if (!map.has(dateKey)) {
      const label = !isNaN(d.getTime()) ? formatMatchDayFrench(d) : 'Date à déterminer';
      const isToday = label === "Aujourd'hui";
      const isTomorrow = label === 'Demain';

      const groupObj: DateGroupedEvents = {
        dateKey,
        label,
        isToday,
        isTomorrow,
        events: [],
      };

      map.set(dateKey, groupObj);
      groups.push(groupObj);
    }

    map.get(dateKey)!.events.push(ev);
  }

  return groups;
}
