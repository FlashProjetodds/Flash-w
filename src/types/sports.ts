/**
 * Types pour les sports découverts dynamiquement et la taxonomie sportive
 */

export interface DiscoveredSport {
  key: string; // e.g. "sport1", "sport2", "sport3", "sport4", "sport13", etc.
  name: string; // e.g. "Football", "Hockey sur glace", "Basketball", "Tennis", "Handball"
  normalizedSport: string; // e.g. "football", "hockey", "basketball", "tennis", "handball"
  matchCount: number;
  lastChecked: string;
}

export const KNOWN_SPORT_NORMALIZATIONS: Record<string, string> = {
  sport1: 'football',
  sport2: 'hockey',
  sport3: 'basketball',
  sport4: 'tennis',
  sport5: 'baseball',
  sport6: 'volleyball',
  sport7: 'rugby',
  sport13: 'handball',
  sport18: 'cricket',
  sport27: 'american-football',
  sport32: 'unihockey',
  sport34: 'mma-boxing',
  sport39: 'tennis-de-table',
  sport40: 'futsal',
};

export const SPORT_LABELS: Record<string, string> = {
  football: 'Football',
  hockey: 'Hockey sur glace',
  basketball: 'Basketball',
  tennis: 'Tennis',
  baseball: 'Baseball',
  volleyball: 'Volley-ball',
  rugby: 'Rugby',
  handball: 'Handball',
  unihockey: 'Unihockey',
  'tennis-de-table': 'Tennis de table',
  futsal: 'Futsal',
  cricket: 'Cricket',
  'american-football': 'Foot Américain',
  'mma-boxing': 'MMA / Boxe',
};

export const SPORT_EMOJIS: Record<string, string> = {
  football: '⚽',
  hockey: '🏒',
  basketball: '🏀',
  tennis: '🎾',
  baseball: '⚾',
  volleyball: '🏐',
  rugby: '🏉',
  handball: '🤾',
  unihockey: '🏒',
  'tennis-de-table': '🏓',
  futsal: '👟',
  cricket: '🏏',
  'american-football': '🏈',
  'mma-boxing': '🥊',
};

export function normalizeSportName(rawKeyOrName: any): string {
  if (!rawKeyOrName || typeof rawKeyOrName !== 'string') {
    return 'football';
  }
  const lower = rawKeyOrName.toLowerCase().trim();
  if (KNOWN_SPORT_NORMALIZATIONS[lower]) {
    return KNOWN_SPORT_NORMALIZATIONS[lower];
  }
  if (lower.includes('american football') || lower.includes('american-football') || lower.includes('foot us') || lower.includes('football am') || lower.includes('nfl')) {
    return 'american-football';
  }
  if (lower.includes('cricket')) return 'cricket';
  if (lower.includes('mma') || lower.includes('ufc') || lower.includes('boxe') || lower.includes('boxing')) return 'mma-boxing';
  if (lower.includes('foot')) return 'football';
  if (lower.includes('hockey')) return 'hockey';
  if (lower.includes('basket')) return 'basketball';
  if (lower.includes('tennis de table') || lower.includes('table tennis') || lower.includes('ping-pong')) return 'tennis-de-table';
  if (lower.includes('tennis')) return 'tennis';
  if (lower.includes('hand')) return 'handball';
  if (lower.includes('volley')) return 'volleyball';
  if (lower.includes('futsal')) return 'futsal';
  if (lower.includes('rugby')) return 'rugby';
  return lower.replace(/[^a-z0-9]/g, '-');
}
