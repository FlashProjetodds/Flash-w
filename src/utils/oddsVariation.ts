/**
 * Utilitaire pour le calcul précis des variations et pourcentages de cotes (actuel vs précédent).
 * RÈGLE STRICTE :
 * - Aucune variation ou pourcentage fictif n'est inventé.
 * - Si aucune cote précédente valide n'existe (<= 1.0 ou absente), retourne null.
 */

export type OddsTrendDirection = 'up' | 'down' | 'stable' | null;

export interface OddsVariationResult {
  hasVariation: boolean;
  currentOdds: number;
  previousOdds: number | null;
  diff: number | null; // e.g. +0.08 or -0.05
  percentage: number | null; // e.g. +4.3 or -2.7 (%)
  trend: OddsTrendDirection;
  direction: OddsTrendDirection;
  formattedDiff: string | null; // e.g. "+0.08" ou "-0.05"
  formattedPercentage: string | null; // e.g. "+4.3%" ou "-2.7%"
  displayText: string | null; // e.g. "↑ +0.08 (+4.3%)" ou "↓ -0.05 (-2.7%)"
  shortText: string | null; // e.g. "+0.08 (+4.3%)"
}

export type OddsInput =
  | number
  | { odds: number; previousOdds?: number | null }
  | null
  | undefined;

/**
 * Calcule la variation absolue et relative (en pourcentage) entre deux cotes.
 *
 * @param current - Cote actuelle (nombre ou objet avec propriété odds)
 * @param previous - Cote précédente (nombre ou objet avec propriété odds, optionnel)
 * @returns OddsVariationResult avec détail de variation, pourcentage et tendance
 */
export function calculateOddsVariation(
  current: OddsInput,
  previous?: OddsInput
): OddsVariationResult {
  // Extraire la cote actuelle
  const currentVal =
    typeof current === 'number'
      ? current
      : current && typeof current.odds === 'number'
      ? current.odds
      : 0;

  // Extraire la cote précédente
  let previousVal: number | null = null;
  if (typeof previous === 'number') {
    previousVal = previous;
  } else if (previous && typeof previous.odds === 'number') {
    previousVal = previous.odds;
  } else if (current && typeof current === 'object' && typeof current.previousOdds === 'number') {
    previousVal = current.previousOdds;
  }

  // Validation de base : cotes décimales valides > 1.0
  if (
    !currentVal ||
    isNaN(currentVal) ||
    currentVal <= 1.0 ||
    previousVal === null ||
    isNaN(previousVal) ||
    previousVal <= 1.0
  ) {
    return {
      hasVariation: false,
      currentOdds: currentVal,
      previousOdds: null,
      diff: null,
      percentage: null,
      trend: null,
      direction: null,
      formattedDiff: null,
      formattedPercentage: null,
      displayText: null,
      shortText: null,
    };
  }

  // Calcul du delta absolu arrondi à 2 décimales
  const diff = Number((currentVal - previousVal).toFixed(2));

  // Calcul du pourcentage relatif : ((actuel - précédent) / précédent) * 100
  const percentage = Number((((currentVal - previousVal) / previousVal) * 100).toFixed(1));

  // Tolérance pour seuil de stabilité (0.001)
  if (Math.abs(diff) < 0.001) {
    return {
      hasVariation: false,
      currentOdds: currentVal,
      previousOdds: previousVal,
      diff: 0,
      percentage: 0,
      trend: 'stable',
      direction: 'stable',
      formattedDiff: '0.00',
      formattedPercentage: '0.0%',
      displayText: '= 0.00 (0.0%)',
      shortText: '0.00 (0.0%)',
    };
  }

  const isUp = diff > 0;
  const trend: OddsTrendDirection = isUp ? 'up' : 'down';
  const sign = isUp ? '+' : '';
  const arrow = isUp ? '↑' : '↓';

  const formattedDiff = `${sign}${diff.toFixed(2)}`;
  const formattedPercentage = `${sign}${percentage.toFixed(1)}%`;
  const shortText = `${formattedDiff} (${formattedPercentage})`;
  const displayText = `${arrow} ${shortText}`;

  return {
    hasVariation: true,
    currentOdds: currentVal,
    previousOdds: previousVal,
    diff,
    percentage,
    trend,
    direction: trend,
    formattedDiff,
    formattedPercentage,
    displayText,
    shortText,
  };
}
