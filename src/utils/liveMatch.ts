import { SportEvent } from '../types';
import { normalizeSportName } from '../types/sports';
import { calculateValidTime } from './time';

export interface LiveMatchTimeInfo {
  isLive: boolean;
  isHalfTime: boolean;
  displayMinute: string; // e.g. "54'", "Mi-temps", "Set 2 : 6-4"
  clockTime: string; // e.g. "54'", "LIVE", "Set 2 : 6-4"
  elapsedText: string; // e.g. "Temps de jeu réel", "Pause mi-temps"
  periodLabel: string; // e.g. "2nde mi-temps", "Set 2 en cours"
  phaseStatus: '1st_half' | 'half_time' | '2nd_half' | 'extra_time' | 'in_play';
}

/**
 * Checks whether an event is explicitly confirmed live by the source.
 * RÈGLE ABSOLUE : Ne JAMAIS considérer qu'un match est en direct uniquement parce que son heure programmée est passée.
 * Un match ne doit apparaître dans « Direct » que si la source indique explicitement qu'il est en cours
 * (statut live, statut in_play, période en cours, score en temps réel actif, etc.).
 */
export function isExplicitLiveMatch(event: SportEvent | null | undefined): boolean {
  if (!event) return false;
  
  // If explicitly finished, never live
  if (event.status === 'finished') return false;

  const status = (event.status || '').toLowerCase().trim();
  return status === 'live' || status === 'halftime';
}

/**
 * Checks whether an event is confirmed finished.
 */
export function isExplicitFinishedMatch(event: SportEvent | null | undefined): boolean {
  if (!event) return false;
  return event.status === 'finished';
}

/**
 * Checks whether an event is currently at half-time (mi-temps).
 */
export function isMatchAtHalfTime(event: SportEvent): boolean {
  if (event.isHalfTime === true) return true;
  if (!event.minute && !event.period) return false;

  const m = (event.minute || '').toLowerCase().trim();
  const p = (event.period || '').toLowerCase().trim();

  const htKeywords = ['ht', 'mi-temps', 'mitemps', 'pause', 'halftime', 'half-time', 'mt'];
  return (
    htKeywords.includes(m) ||
    htKeywords.includes(p) ||
    m.includes('mi-temps') ||
    m.includes('pause') ||
    p.includes('mi-temps') ||
    p.includes('pause')
  );
}

/**
 * Calculates real-time elapsed match duration and current game phase.
 * RÈGLE ABSOLUE : Pas de calcul de temps factice basé sur startTime.
 */
export function getLiveMatchTimeInfo(event: SportEvent): LiveMatchTimeInfo {
  const isLive = event.status === 'live';

  if (!isLive) {
    const isFinished = event.status === 'finished';
    return {
      isLive: false,
      isHalfTime: false,
      displayMinute: isFinished ? 'Terminé' : 'À venir',
      clockTime: isFinished ? 'FT' : '--:--',
      elapsedText: isFinished ? 'Match terminé' : 'Pas commencé',
      periodLabel: isFinished ? 'Terminé' : 'Programmé',
      phaseStatus: 'in_play',
    };
  }

  const isHalfTime = isMatchAtHalfTime(event);
  const normalizedTime = calculateValidTime(event);
  const sport = normalizeSportName(event.sport || 'football');
  const rawPeriod = (event.period || '').trim();

  if (isHalfTime) {
    return {
      isLive: true,
      isHalfTime: true,
      displayMinute: 'Mi-temps',
      clockTime: 'MI-TEMPS',
      elapsedText: 'Pause réglementaire (15 min)',
      periodLabel: 'Mi-temps · Pause au vestiaire',
      phaseStatus: 'half_time',
    };
  }

  // Detect phase status for soccer if possible
  let phaseStatus: LiveMatchTimeInfo['phaseStatus'] = 'in_play';
  let periodLabel = rawPeriod || normalizedTime || 'En direct';

  if (sport === 'football') {
    const minMatch = (event.minute || '').match(/^(\d+)/);
    if (minMatch) {
      const mins = parseInt(minMatch[1], 10);
      if (mins > 45) {
        phaseStatus = '2nd_half';
        periodLabel = '2nde mi-temps';
      } else {
        phaseStatus = '1st_half';
        periodLabel = '1ère mi-temps';
      }
    }
  }

  // Use the cleanly calculated valid time for the clocks
  // This avoids any fake ticking clocks or currentTime - startTime calculations!
  return {
    isLive: true,
    isHalfTime: false,
    displayMinute: normalizedTime,
    clockTime: normalizedTime,
    elapsedText: normalizedTime === 'LIVE' ? 'En direct' : `Temps : ${normalizedTime}`,
    periodLabel,
    phaseStatus,
  };
}

/**
 * Hook providing a live ticking clock every second for ongoing sports events.
 * RÈGLE ABSOLUE : Puisque nous n'utilisons plus startTime pour simuler une horloge
 * artificielle, nous retournons simplement les informations de temps réelles de la source.
 */
export function useLiveMatchClock(event: SportEvent) {
  return getLiveMatchTimeInfo(event);
}
