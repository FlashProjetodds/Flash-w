import { SportEvent } from '../types';
import { normalizeSportName } from '../types/sports';

/**
 * Centralized, sport-specific normalization of match progress times,
 * eliminating aberrant ticking stopwatches (> 90 min for football),
 * preventing fake continuous minute calculation with startTime,
 * and mapping tennis, basketball, volleyball, table tennis, and cricket
 * to their real score and clock structures.
 */
export function calculateValidTime(event: SportEvent): string {
  if (event.status === 'finished') {
    return 'Terminé';
  }
  if (event.status === 'upcoming') {
    return 'À venir';
  }

  const sport = normalizeSportName(event.sport || 'football');
  const rawMinute = (event.minute || '').trim();
  const rawPeriod = (event.period || '').trim();
  const rawElapsed = (event.elapsedTime || '').trim();

  // Check for halftime (Mi-temps)
  const isHT = 
    rawMinute.toLowerCase().includes('mi-temps') || 
    rawMinute.toLowerCase().includes('ht') || 
    rawPeriod.toLowerCase().includes('mi-temps') ||
    rawPeriod.toLowerCase().includes('ht') ||
    event.isHalfTime === true;

  if (isHT) {
    return 'Mi-temps';
  }

  // 1. Football / Futsal / Rugby
  if (sport === 'football' || sport === 'futsal' || sport === 'rugby') {
    // Stoppage time like "45+2" or "90+3"
    const stoppageMatch = rawMinute.match(/(\d+)\s*\+\s*(\d+)/) || rawElapsed.match(/(\d+)\s*\+\s*(\d+)/);
    if (stoppageMatch) {
      return `${stoppageMatch[1]}+${stoppageMatch[2]}'`;
    }

    // Check if a real clock exists in minute or elapsedTime (has numbers)
    const clockMatch = rawMinute.match(/(\d+)/) || rawElapsed.match(/(\d+)/);
    if (clockMatch) {
      const mins = parseInt(clockMatch[1], 10);
      if (mins > 90 && sport === 'football') {
        return "90+'";
      }
      return `${mins}'`;
    }

    // Si la source n'a pas encore injecté la minute mais que le match est confirmé en direct
    // et possède une heure de début réelle vérifiable (dans la fenêtre normale d'un match de 120 min max)
    if (event.startTime && event.status === 'live') {
      const startMs = new Date(event.startTime).getTime();
      if (!isNaN(startMs)) {
        const diffMinutes = Math.floor((Date.now() - startMs) / 60000);
        if (diffMinutes >= 1 && diffMinutes <= 120) {
          if (diffMinutes <= 45) return `${diffMinutes}'`;
          if (diffMinutes <= 60) return 'Mi-temps';
          if (diffMinutes <= 105) return `${diffMinutes - 15}'`;
          return "90+'";
        }
      }
    }

    return 'LIVE';
  }

  // 2. Basketball
  if (sport === 'basketball') {
    const qMatch = (rawPeriod || rawMinute).match(/(?:Q([1-4])|([1-4])(?:e|th|rd|nd|st)?\s*QT?|([1-4])(?:e|th|rd|nd|st)?\s*Quarter|OT)/i);
    if (qMatch) {
      const qNum = qMatch[1] || qMatch[2] || qMatch[3];
      const qLabel = qMatch[0].toUpperCase().includes('OT') ? 'OT' : `Q${qNum}`;
      const minMatch = (rawMinute || rawPeriod).match(/(\d+)\s*(?:`|'|min)/i);
      if (minMatch) {
        return `${qLabel} · ${minMatch[1]}'`;
      }
      return qLabel;
    }
    const hasDigits = /\d/.test(rawMinute) || /\d/.test(rawPeriod);
    if (hasDigits && !rawMinute.includes('-') && !rawMinute.includes(':')) {
      return rawPeriod || rawMinute;
    }
    return 'LIVE';
  }

  // 3. Hockey / Handball
  if (sport === 'hockey' || sport === 'handball') {
    // If exact minutes (e.g. "55 Min." -> "55'")
    const minMatch = (rawMinute || rawElapsed).match(/(\d+)\s*(?:min|'|`)/i);
    if (minMatch) {
      return `${minMatch[1]}'`;
    }

    const pMatch = (rawPeriod || rawMinute).match(/(T[1-3]|P[1-3]|OT|\b[1-3]e\s*T\b|\b[1-3]rd\b)/i);
    if (pMatch) {
      return pMatch[0].toUpperCase();
    }
    const p = rawPeriod || rawMinute;
    if (/\d/.test(p) && !p.includes('-') && !p.includes(':')) {
      return p;
    }
    return 'LIVE';
  }

  // 4. Tennis (Strict: Set period without duplicate score)
  if (sport === 'tennis') {
    const sourceSets = event.score?.detail || rawMinute || rawPeriod;
    if (sourceSets && (sourceSets.includes(',') || sourceSets.includes(' '))) {
      const sets = sourceSets.split(/[,\s]+/).map(s => s.trim()).filter(s => /^\d+:\d+$/.test(s) || /^\d+-\d+$/.test(s));
      if (sets.length > 0) {
        return `Set ${sets.length}`;
      }
    }
    const scoreSets = (event.score as any)?.sets;
    if (scoreSets && Array.isArray(scoreSets) && scoreSets.length > 0) {
      return `Set ${scoreSets.length}`;
    }
    if (event.score?.detail) {
      const parts = event.score.detail.split(',').map(s => s.trim()).filter(Boolean);
      return `Set ${parts.length || 1}`;
    }
    const setMatch = (rawPeriod || rawMinute).match(/Set\s*(\d)/i) || (rawPeriod || rawMinute).match(/(\d)(?:e|er|è)?\s*Set/i);
    if (setMatch) return `Set ${setMatch[1]}`;
    return 'LIVE';
  }

  // 5. Volleyball / Table Tennis (Strict: Set period without duplicate score)
  if (sport === 'volleyball' || sport === 'tennis-de-table') {
    const sourceSets = event.score?.detail || rawMinute || rawPeriod;
    if (sourceSets && (sourceSets.includes(',') || sourceSets.includes(' '))) {
      const sets = sourceSets.split(/[,\s]+/).map(s => s.trim()).filter(s => /^\d+:\d+$/.test(s) || /^\d+-\d+$/.test(s));
      if (sets.length > 0) {
        return `Set ${sets.length}`;
      }
    }
    const scoreSets = (event.score as any)?.sets;
    if (scoreSets && Array.isArray(scoreSets) && scoreSets.length > 0) {
      return `Set ${scoreSets.length}`;
    }
    if (event.score?.detail) {
      const parts = event.score.detail.split(',').map(s => s.trim()).filter(Boolean);
      return `Set ${parts.length || 1}`;
    }
    const setMatch = (rawPeriod || rawMinute).match(/Set\s*(\d)/i) || (rawPeriod || rawMinute).match(/(\d)(?:e|er|è)?\s*Set/i);
    if (setMatch) return `Set ${setMatch[1]}`;
    return 'LIVE';
  }

  // 6. Cricket (Strict: Overs only, without duplicate runs/wickets)
  if (sport === 'cricket') {
    if (rawPeriod && (rawPeriod.toLowerCase().includes('innings') || rawPeriod.toLowerCase().includes('inn'))) {
      return rawPeriod;
    }
    const text = `${rawPeriod} ${rawMinute}`;
    const overMatch = text.match(/(?:ov(?:ers?)?|b)\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*ov/i);
    if (overMatch) {
      return `Ov ${overMatch[1]}`;
    }
    return 'LIVE';
  }

  // 7. American Football (Quarters & Clock, e.g. "QT4 05:40", "Q2 10:15", "OT")
  if (sport === 'american-football') {
    const raw = (rawMinute || rawPeriod || rawElapsed).trim();
    if (raw) {
      return raw;
    }
    return 'LIVE';
  }

  // General fallback for other sports: reject any score-like strings (e.g. "2-1")
  if (rawPeriod && !rawPeriod.includes('-') && !rawPeriod.includes(':')) {
    return rawPeriod;
  }
  if (rawMinute && !rawMinute.includes('-') && !rawMinute.includes(':')) {
    return rawMinute;
  }
  return 'LIVE';
}

/**
 * Returns the reliable elapsed time or game period for an in-play match.
 * Returns null if progress time cannot be reliably determined, so UI
 * shows only the LIVE badge without any fabricated duration.
 */
export function getValidElapsedTime(event: SportEvent): string | null {
  const time = calculateValidTime(event);
  if (!time || time === 'LIVE' || time === 'Terminé' || time === 'À venir') {
    return null;
  }
  return time;
}
