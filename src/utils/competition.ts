import { calculateOddsVariation } from './oddsVariation';

/**
 * Helper to display flags and competition badges
 */
export function getCompetitionFlag(competition: string): string {
  if (!competition) return '🏆';
  const comp = competition.toLowerCase();

  if (comp.includes('france') || comp.includes('ligue 1') || comp.includes('ligue 2')) return '🇫🇷';
  if (comp.includes('angleterre') || comp.includes('premier league') || comp.includes('fa cup')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (comp.includes('espagne') || comp.includes('la liga') || comp.includes('copa del rey')) return '🇪🇸';
  if (comp.includes('italie') || comp.includes('serie a') || comp.includes('coppa italia')) return '🇮🇹';
  if (comp.includes('allemagne') || comp.includes('bundesliga')) return '🇩🇪';
  if (comp.includes('portugal') || comp.includes('primeira liga')) return '🇵🇹';
  if (comp.includes('pays-bas') || comp.includes('eredivisie')) return '🇳🇱';
  if (comp.includes('belgique') || comp.includes('pro league')) return '🇧🇪';
  if (comp.includes('turquie') || comp.includes('super lig')) return '🇹🇷';
  if (comp.includes('champions league') || comp.includes('europa') || comp.includes('uefa')) return '🇪🇺';
  if (comp.includes('nba') || comp.includes('etats-unis') || comp.includes('usa')) return '🇺🇸';
  if (comp.includes('atp') || comp.includes('wta') || comp.includes('roland') || comp.includes('wimbledon')) return '🎾';
  if (comp.includes('coupe du monde') || comp.includes('monde') || comp.includes('world')) return '🌍';

  return '🏆';
}

export function formatOddsVariation(
  odds: number,
  previousOdds?: number,
  trend?: 'up' | 'down' | 'stable'
): { direction: 'up' | 'down'; text: string; percentage?: string } | null {
  const calc = calculateOddsVariation(odds, previousOdds);
  if (calc.hasVariation && (calc.trend === 'up' || calc.trend === 'down')) {
    return {
      direction: calc.trend,
      text: calc.displayText || `${calc.trend === 'up' ? '↑' : '↓'} ${calc.formattedDiff} (${calc.formattedPercentage})`,
      percentage: calc.formattedPercentage || undefined,
    };
  }

  return null;
}

