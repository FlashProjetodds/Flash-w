import { MarketCategory } from '../types';

/**
 * Builds an explicit, user-friendly display string for a selection.
 * Examples:
 * - 1X2: "1 — Canada gagne", "N — Match nul", "2 — Chili gagne"
 * - Double Chance: "1N — Canada ou Nul", "12 — Canada ou Chili", "N2 — Nul ou Chili"
 * - BTTS: "Les deux équipes marquent — Oui", "Les deux équipes marquent — Non"
 * - Totaux / Over Under: "Plus de 2.5 buts", "Moins de 1.5 buts"
 */
export function formatSelectionDisplay(
  marketType: MarketCategory | string | undefined,
  marketName: string,
  selectionName: string,
  homeTeam: string,
  awayTeam: string
): string {
  const cleanMkt = (marketName || '').toLowerCase();
  const cleanSel = (selectionName || '').trim();
  const lowerSel = cleanSel.toLowerCase();
  const home = homeTeam?.trim() || 'Domicile';
  const away = awayTeam?.trim() || 'Extérieur';

  // 1. Marché Résultat du match (1X2 / 1N2)
  if (
    marketType === 'result' ||
    cleanMkt.includes('1x2') ||
    cleanMkt.includes('1n2') ||
    cleanMkt.includes('résultat') ||
    cleanMkt.includes('vainqueur')
  ) {
    if (cleanSel === '1') {
      return `1 — ${home} gagne`;
    }
    if (
      cleanSel === 'N' ||
      cleanSel === 'X' ||
      lowerSel === 'nul' ||
      lowerSel.includes('match nul') ||
      lowerSel === 'draw'
    ) {
      return `N — Match nul`;
    }
    if (cleanSel === '2') {
      return `2 — ${away} gagne`;
    }

    // Si le nom correspond à l'une des équipes
    if (lowerSel.includes(home.toLowerCase()) || home.toLowerCase().includes(lowerSel)) {
      return `1 — ${home} gagne`;
    }
    if (lowerSel.includes(away.toLowerCase()) || away.toLowerCase().includes(lowerSel)) {
      return `2 — ${away} gagne`;
    }

    return `${cleanSel}`;
  }

  // 2. Marché Double Chance
  if (marketType === 'double_chance' || cleanMkt.includes('double chance')) {
    if (lowerSel.includes('1n') || lowerSel.includes('1x') || lowerSel.includes('1/n')) {
      return `1N — ${home} ou Nul`;
    }
    if (lowerSel.includes('12') || lowerSel.includes('1/2')) {
      return `12 — ${home} ou ${away}`;
    }
    if (lowerSel.includes('n2') || lowerSel.includes('x2') || lowerSel.includes('n/2')) {
      return `N2 — Nul ou ${away}`;
    }
    return `${cleanSel}`;
  }

  // 3. Marché Les deux équipes marquent (BTTS)
  if (marketType === 'btts' || cleanMkt.includes('marquent') || cleanMkt.includes('btts')) {
    if (lowerSel === 'oui' || lowerSel === 'yes' || lowerSel.includes('oui')) {
      return `Les deux équipes marquent — Oui`;
    }
    if (lowerSel === 'non' || lowerSel === 'no' || lowerSel.includes('non')) {
      return `Les deux équipes marquent — Non`;
    }
    return `Les deux équipes marquent — ${cleanSel}`;
  }

  // 4. Marché Plus / Moins de buts (Over / Under)
  if (
    marketType === 'goals' ||
    cleanMkt.includes('plus / moins') ||
    cleanMkt.includes('buts') ||
    cleanMkt.includes('over') ||
    cleanMkt.includes('under')
  ) {
    if (lowerSel.includes('plus') || cleanSel.startsWith('+')) {
      return cleanSel.includes('but') ? cleanSel : `${cleanSel} buts`;
    }
    if (lowerSel.includes('moins') || cleanSel.startsWith('-')) {
      return cleanSel.includes('but') ? cleanSel : `${cleanSel} buts`;
    }
    return `${cleanSel}`;
  }

  // 5. Mi-temps
  if (marketType === 'half_time' || cleanMkt.includes('mi-temps') || cleanMkt.includes('pair')) {
    if (cleanSel === '1' || cleanSel.startsWith('1 (MT')) return `1 — ${home} en tête (MT)`;
    if (cleanSel === 'N' || cleanSel === 'X' || cleanSel.startsWith('Nul (MT')) return `N — Égalité (MT)`;
    if (cleanSel === '2' || cleanSel.startsWith('2 (MT')) return `2 — ${away} en tête (MT)`;
    if (lowerSel === 'pair') return `Nombre de buts : Pair`;
    if (lowerSel === 'impair') return `Nombre de buts : Impair`;
  }

  // 6. Handicap asiatique
  if (marketType === 'handicap' || cleanMkt.includes('handicap')) {
    if (cleanSel.startsWith('1')) return `${home} ${cleanSel}`;
    if (cleanSel.startsWith('2')) return `${away} ${cleanSel}`;
  }

  return cleanSel;
}

/**
 * Extracts clean initials from a team name.
 */
export function getTeamInitials(name: string): string {
  if (!name) return '';
  const clean = name.replace(/[\(\)\[\]]/g, '').trim();
  const parts = clean.split(/[\s-]+/).filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const ignored = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'd', 'l', 'of', 'the']);
  const meaningful = parts.filter(p => !ignored.has(p.toLowerCase()));

  if (meaningful.length >= 2) {
    if (meaningful.length >= 3) {
      return (meaningful[0][0] + meaningful[1][0] + meaningful[2][0]).toUpperCase();
    }
    return (meaningful[0][0] + meaningful[1][0]).toUpperCase();
  }

  if (meaningful.length === 1) {
    return meaningful[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}
