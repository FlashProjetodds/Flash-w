import { SportEvent, Market, OddSelection, MarketCategory } from '../../types';
import { normalizeSportName } from '../../types/sports';

/**
 * Calculateur de factorielle pour distributions de Poisson
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Probabilité de Poisson : P(k; λ) = (λ^k * e^-λ) / k!
 */
function poissonProb(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Probabilité cumulée de Poisson pour P(X <= n; λ)
 */
function cumulativePoisson(n: number, lambda: number): number {
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    sum += poissonProb(k, lambda);
  }
  return sum;
}

/**
 * Conversion d'une probabilité brute en cote FLASH avec marge sécurisée
 */
function probToFlashOdds(prob: number, margin = 0.075): number {
  if (prob <= 0.005) return 40.0;
  if (prob >= 0.995) return 1.02;
  const rawOdds = 1 / (prob * (1 + margin));
  return Math.min(40.0, Math.max(1.03, parseFloat(rawOdds.toFixed(2))));
}

/**
 * Extraction robuste du temps de jeu écoulé en minutes
 */
function extractElapsedMinutes(event: SportEvent): number {
  if (typeof event.elapsedMinutes === 'number' && !isNaN(event.elapsedMinutes)) {
    return event.elapsedMinutes;
  }
  const textSource = `${event.minute || ''} ${event.elapsedTime || ''}`.trim();
  const match = textSource.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}

/**
 * Extraction robuste du score actuel
 */
function extractCurrentScore(event: SportEvent): { home: number; away: number; total: number } {
  const home = event.scoreHome ?? event.score?.home ?? 0;
  const away = event.scoreAway ?? event.score?.away ?? 0;
  return { home, away, total: home + away };
}

/**
 * Registre Universel des Marchés de FLASH
 * Couvre : Football, Basketball, Tennis, Hockey sur glace, Handball, Volleyball et Futsal.
 */
export class MarketRegistry {
  public static readonly SUPPORTED_SPORTS = [
    'football',
    'basketball',
    'tennis',
    'hockey',
    'handball',
    'volleyball',
    'futsal',
    'cricket',
    'american-football',
    'rugby',
    'tennis-de-table',
    'mma-boxing',
  ] as const;

  /**
   * Retourne la liste des sports couverts par le registre
   */
  public static getSupportedSports(): readonly string[] {
    return this.SUPPORTED_SPORTS;
  }

  /**
   * Méthode centrale : Génère l'ensemble des marchés universels calculables pour un événement.
   * Filtre et auto-élague les marchés et intervalles expirés ou impossibles.
   */
  public static generateMarketsForEvent(event: SportEvent): Market[] {
    const rawSport = (event.sport || 'football').toLowerCase();
    const sport = normalizeSportName(rawSport);
    const score = extractCurrentScore(event);
    const elapsedMinutes = extractElapsedMinutes(event);
    const isLive = event.status === 'live' || (event.status as string) === 'LIVE';
    const isFinished = event.status === 'finished';

    switch (sport) {
      case 'football':
      case 'futsal':
        return this.generateFootballMarkets(event, score, elapsedMinutes, isLive, isFinished, sport === 'futsal');

      case 'basketball':
        return this.generateBasketballMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'handball':
        return this.generateHandballMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'volleyball':
        return this.generateVolleyballMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'hockey':
        return this.generateHockeyMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'tennis':
        return this.generateTennisMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'cricket':
        return this.generateCricketMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'american-football':
        return this.generateAmericanFootballMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'rugby':
        return this.generateRugbyMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'tennis-de-table':
        return this.generateTableTennisMarkets(event, score, elapsedMinutes, isLive, isFinished);

      case 'mma-boxing':
        return this.generateMmaBoxingMarkets(event, score, elapsedMinutes, isLive, isFinished);

      default:
        // Fallback générique football pour les sports non répertoriés
        return this.generateFootballMarkets(event, score, elapsedMinutes, isLive, isFinished, false);
    }
  }

  // ==========================================================================
  // 1. FOOTBALL & FUTSAL (Totaux, Intervalles 10 min, Score exact & BTTS)
  // ==========================================================================
  private static generateFootballMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean,
    isFutsal: boolean
  ): Market[] {
    const markets: Market[] = [];
    const totalDuration = isFutsal ? 40 : 90;
    const halfDuration = isFutsal ? 20 : 45;

    // Détection de la phase de jeu
    const isHalfTime = event.isHalfTime || (event.period || '').toLowerCase().includes('mi-temps') || (elapsedMinutes >= halfDuration && elapsedMinutes < halfDuration + 3);
    const isSecondHalf = elapsedMinutes > halfDuration || (event.period || '').toLowerCase().includes('2e');
    const isMatchCompleted = isFinished || elapsedMinutes >= totalDuration;

    // Taux de base de buts par match (Football: ~2.65, Futsal: ~5.8)
    const baseLambdaTotal = isFutsal ? 5.8 : 2.65;
    const baseLambdaHome = baseLambdaTotal * 0.55;
    const baseLambdaAway = baseLambdaTotal * 0.45;

    // Facteur d'atténuation du temps restant
    const remainingFraction = isMatchCompleted ? 0 : Math.max(0, totalDuration - elapsedMinutes) / totalDuration;
    const remLambdaTotal = Math.max(0.05, baseLambdaTotal * remainingFraction);
    const remLambdaHome = Math.max(0.03, baseLambdaHome * remainingFraction);
    const remLambdaAway = Math.max(0.02, baseLambdaAway * remainingFraction);

    // ------------------------------------------------------------------------
    // 0. Résultat du Match (1N2)
    // ------------------------------------------------------------------------
    const goalDiff = score.home - score.away;
    let pHome = 0.45;
    let pDraw = 0.28;
    let pAway = 0.27;

    if (isLive) {
      if (goalDiff > 0) {
        const lead = Math.min(goalDiff * 0.28 + (elapsedMinutes / totalDuration) * 0.35, 0.94);
        pHome = 0.45 + lead * 0.52;
        pDraw = Math.max(0.03, 0.28 * (1 - lead));
        pAway = Math.max(0.01, 1 - pHome - pDraw);
      } else if (goalDiff < 0) {
        const lead = Math.min(Math.abs(goalDiff) * 0.28 + (elapsedMinutes / totalDuration) * 0.35, 0.94);
        pAway = 0.40 + lead * 0.55;
        pDraw = Math.max(0.03, 0.28 * (1 - lead));
        pHome = Math.max(0.01, 1 - pAway - pDraw);
      } else {
        const drawTrend = (elapsedMinutes / totalDuration) * 0.35;
        pDraw = 0.28 + drawTrend;
        pHome = (1 - pDraw) * 0.55;
        pAway = (1 - pDraw) * 0.45;
      }
    }

    markets.push({
      id: 'fb-match-result',
      type: 'result',
      name: 'Résultat du Match (1N2)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-fb-1', name: event.homeTeam, odds: probToFlashOdds(pHome), isSuspended: isMatchCompleted },
        { id: 'sel-fb-n', name: 'Match nul', odds: probToFlashOdds(pDraw), isSuspended: isMatchCompleted },
        { id: 'sel-fb-2', name: event.awayTeam, odds: probToFlashOdds(pAway), isSuspended: isMatchCompleted },
      ],
    });

    // ------------------------------------------------------------------------
    // A. Total Buts Global (Match, 1re Mi-Temps, 2e Mi-Temps)
    // ------------------------------------------------------------------------
    const matchThresholds = isFutsal ? [3.5, 4.5, 5.5, 6.5, 7.5] : [0.5, 1.5, 2.5, 3.5, 4.5];

    // 1. Total Buts Match
    for (const threshold of matchThresholds) {
      const alreadyExceeded = score.total > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;

      // Calcul des probabilités de dépasser le seuil
      const neededFuture = Math.max(0, Math.ceil(threshold) - score.total);
      let pOver = 0.5;
      if (alreadyExceeded) {
        pOver = 1.0;
      } else if (isMatchCompleted) {
        pOver = 0.0;
      } else {
        const pUnder = cumulativePoisson(neededFuture - 1, remLambdaTotal);
        pOver = Math.max(0.01, Math.min(0.99, 1 - pUnder));
      }

      const pUnder = 1 - pOver;
      markets.push({
        id: `fb-goals-match-${threshold}`,
        type: 'goals',
        name: `Total Buts Match (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          {
            id: `sel-ov-${threshold}`,
            name: `Plus de ${threshold}`,
            odds: alreadyExceeded ? 1.01 : probToFlashOdds(pOver),
            isSuspended,
          },
          {
            id: `sel-un-${threshold}`,
            name: `Moins de ${threshold}`,
            odds: alreadyExceeded ? 40.0 : probToFlashOdds(pUnder),
            isSuspended,
          },
        ],
      });
    }

    // 2. Total Buts 1re Mi-Temps (MT1)
    const mt1Expired = isMatchCompleted || isSecondHalf || isHalfTime || elapsedMinutes >= halfDuration;
    const mt1Thresholds = [0.5, 1.5, 2.5];
    for (const threshold of mt1Thresholds) {
      const alreadyExceeded = score.total > threshold;
      const isSuspended = mt1Expired || alreadyExceeded;
      const pOver = alreadyExceeded ? 1.0 : mt1Expired ? 0.0 : 0.45;
      const pUnder = 1 - pOver;

      markets.push({
        id: `fb-goals-mt1-${threshold}`,
        type: 'half_time',
        name: `1re Mi-Temps - Total Buts (Plus / Moins ${threshold})`,
        isLive: isLive && !mt1Expired,
        isSuspended,
        selections: [
          { id: `sel-mt1-ov-${threshold}`, name: `Plus de ${threshold}`, odds: probToFlashOdds(pOver), isSuspended },
          { id: `sel-mt1-un-${threshold}`, name: `Moins de ${threshold}`, odds: probToFlashOdds(pUnder), isSuspended },
        ],
      });
    }

    // 3. Total Buts 2e Mi-Temps (MT2)
    const mt2Expired = isMatchCompleted;
    for (const threshold of mt1Thresholds) {
      const isSuspended = mt2Expired;
      const pOver = mt2Expired ? 0.0 : 0.52;
      const pUnder = 1 - pOver;

      markets.push({
        id: `fb-goals-mt2-${threshold}`,
        type: 'half_time',
        name: `2e Mi-Temps - Total Buts (Plus / Moins ${threshold})`,
        isLive: isLive && isSecondHalf && !isMatchCompleted,
        isSuspended,
        selections: [
          { id: `sel-mt2-ov-${threshold}`, name: `Plus de ${threshold}`, odds: probToFlashOdds(pOver), isSuspended },
          { id: `sel-mt2-un-${threshold}`, name: `Moins de ${threshold}`, odds: probToFlashOdds(pUnder), isSuspended },
        ],
      });
    }

    // ------------------------------------------------------------------------
    // B. Total Domicile & Total Extérieur (Match, MT1, MT2)
    // ------------------------------------------------------------------------
    const teamThresholds = [0.5, 1.5, 2.5];

    // Domicile Match
    for (const threshold of teamThresholds) {
      const alreadyExceeded = score.home > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;
      const needed = Math.max(0, Math.ceil(threshold) - score.home);
      const pUnder = alreadyExceeded ? 0 : cumulativePoisson(needed - 1, remLambdaHome);
      const pOver = Math.max(0.01, Math.min(0.99, 1 - pUnder));

      markets.push({
        id: `fb-goals-home-${threshold}`,
        type: 'goals',
        name: `Total Buts ${event.homeTeam} (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          { id: `sel-home-ov-${threshold}`, name: `Plus de ${threshold}`, odds: probToFlashOdds(pOver), isSuspended },
          { id: `sel-home-un-${threshold}`, name: `Moins de ${threshold}`, odds: probToFlashOdds(1 - pOver), isSuspended },
        ],
      });
    }

    // Extérieur Match
    for (const threshold of teamThresholds) {
      const alreadyExceeded = score.away > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;
      const needed = Math.max(0, Math.ceil(threshold) - score.away);
      const pUnder = alreadyExceeded ? 0 : cumulativePoisson(needed - 1, remLambdaAway);
      const pOver = Math.max(0.01, Math.min(0.99, 1 - pUnder));

      markets.push({
        id: `fb-goals-away-${threshold}`,
        type: 'goals',
        name: `Total Buts ${event.awayTeam} (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          { id: `sel-away-ov-${threshold}`, name: `Plus de ${threshold}`, odds: probToFlashOdds(pOver), isSuspended },
          { id: `sel-away-un-${threshold}`, name: `Moins de ${threshold}`, odds: probToFlashOdds(1 - pOver), isSuspended },
        ],
      });
    }

    // ------------------------------------------------------------------------
    // C. Football Intervalles : Buts par tranche de 10 min (0-10, 11-20, ... 81-90)
    // ------------------------------------------------------------------------
    if (!isFutsal) {
      const intervals = [
        { start: 0, end: 10, label: '01e - 10e minute' },
        { start: 11, end: 20, label: '11e - 20e minute' },
        { start: 21, end: 30, label: '21e - 30e minute' },
        { start: 31, end: 40, label: '31e - 40e minute' },
        { start: 41, end: 50, label: '41e - 50e minute' },
        { start: 51, end: 60, label: '51e - 60e minute' },
        { start: 61, end: 70, label: '61e - 70e minute' },
        { start: 71, end: 80, label: '71e - 80e minute' },
        { start: 81, end: 90, label: '81e - 90e minute' },
      ];

      for (const interval of intervals) {
        // Auto-élagage : si le temps actuel a dépassé la fin de la tranche, le marché est expiré/fermé
        const isExpired = isMatchCompleted || elapsedMinutes > interval.end;
        const isCurrentInterval = elapsedMinutes >= interval.start && elapsedMinutes <= interval.end;
        const isSuspended = isExpired;

        // Probabilité d'avoir au moins un but dans un intervalle de 10 min (~26%)
        let pGoal = 0.26;
        if (isCurrentInterval) {
          const remInInterval = Math.max(1, interval.end - elapsedMinutes);
          pGoal = Math.max(0.04, 0.26 * (remInInterval / 10));
        } else if (isExpired) {
          pGoal = 0.0;
        }

        const pNoGoal = 1 - pGoal;

        markets.push({
          id: `fb-interval-${interval.start}-${interval.end}`,
          type: 'intervals',
          name: `But dans l'intervalle : ${interval.label}`,
          isLive: isLive && isCurrentInterval,
          isSuspended,
          selections: [
            {
              id: `sel-int-yes-${interval.start}`,
              name: `Oui (But marqué)`,
              odds: isExpired ? 40.0 : probToFlashOdds(pGoal),
              isSuspended,
            },
            {
              id: `sel-int-no-${interval.start}`,
              name: `Non (Pas de but)`,
              odds: isExpired ? 1.01 : probToFlashOdds(pNoGoal),
              isSuspended,
            },
          ],
        });
      }
    }

    // ------------------------------------------------------------------------
    // D. Football Scores : Score exact dynamique & Les deux équipes marquent (BTTS)
    // ------------------------------------------------------------------------
    // 1. Les deux équipes marquent (Match, MT1, MT2)
    const bothScored = score.home > 0 && score.away > 0;
    const bttsMatchSuspended = isMatchCompleted || bothScored;
    let pBttsYes = bothScored ? 1.0 : isMatchCompleted ? 0.0 : Math.min(0.85, (1 - Math.exp(-remLambdaHome)) * (1 - Math.exp(-remLambdaAway)) + (score.home > 0 || score.away > 0 ? 0.35 : 0));
    
    markets.push({
      id: 'fb-btts-match',
      type: 'btts',
      name: 'Les deux équipes marquent (BTTS) - Match',
      isLive,
      isSuspended: bttsMatchSuspended,
      selections: [
        { id: 'sel-btts-yes', name: 'Oui', odds: bothScored ? 1.01 : probToFlashOdds(pBttsYes), isSuspended: bttsMatchSuspended },
        { id: 'sel-btts-no', name: 'Non', odds: bothScored ? 40.0 : probToFlashOdds(1 - pBttsYes), isSuspended: bttsMatchSuspended },
      ],
    });

    // BTTS MT1
    const bttsMt1Suspended = mt1Expired || bothScored;
    markets.push({
      id: 'fb-btts-mt1',
      type: 'half_time',
      name: '1re Mi-Temps : Les deux équipes marquent',
      isLive: isLive && !mt1Expired,
      isSuspended: bttsMt1Suspended,
      selections: [
        { id: 'sel-btts-mt1-yes', name: 'Oui', odds: probToFlashOdds(0.38), isSuspended: bttsMt1Suspended },
        { id: 'sel-btts-mt1-no', name: 'Non', odds: probToFlashOdds(0.62), isSuspended: bttsMt1Suspended },
      ],
    });

    // 2. Score exact dynamique
    const candidateScores = [
      [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2],
      [0, 0], [1, 1], [2, 2], [3, 3],
      [0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3]
    ];

    const exactScoreSelections: OddSelection[] = [];
    let cumulativeProb = 0;

    for (const [targetH, targetA] of candidateScores) {
      // Auto-élagage mathématique : si le score en direct est déjà supérieur au score cible, impossible !
      const isMathematicallyImpossible = score.home > targetH || score.away > targetA;
      const isCurrentExact = score.home === targetH && score.away === targetA;
      const isSuspended = isMatchCompleted ? !isCurrentExact : isMathematicallyImpossible;

      let scoreProb = 0.02;
      if (isMathematicallyImpossible) {
        scoreProb = 0.0001;
      } else if (isMatchCompleted) {
        scoreProb = isCurrentExact ? 1.0 : 0.0001;
      } else {
        const deltaH = targetH - score.home;
        const deltaA = targetA - score.away;
        scoreProb = poissonProb(deltaH, remLambdaHome) * poissonProb(deltaA, remLambdaAway);
      }

      cumulativeProb += scoreProb;

      exactScoreSelections.push({
        id: `sel-exact-${targetH}-${targetA}`,
        name: `${targetH} - ${targetA}`,
        odds: isMathematicallyImpossible ? 40.0 : probToFlashOdds(scoreProb),
        isSuspended,
      });
    }

    // Sélection "Autre score"
    const otherScoreProb = Math.max(0.04, 1 - cumulativeProb);
    exactScoreSelections.push({
      id: 'sel-exact-other',
      name: 'Autre score',
      odds: probToFlashOdds(otherScoreProb),
      isSuspended: isMatchCompleted,
    });

    markets.push({
      id: 'fb-exact-score',
      type: 'exact_score',
      name: 'Score Exact Dynamique',
      isLive,
      isSuspended: isMatchCompleted,
      selections: exactScoreSelections,
    });

    return markets;
  }

  // ==========================================================================
  // 2. BASKETBALL (Vainqueur, Handicaps et Totaux par Période / Quart-Temps)
  // ==========================================================================
  private static generateBasketballMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished || elapsedMinutes >= 48;

    // 1. Vainqueur du Match (1-2)
    const diff = score.home - score.away;
    const pHome = isMatchCompleted ? (diff > 0 ? 1.0 : 0.0) : Math.min(0.96, Math.max(0.04, 0.52 + diff * 0.02));
    markets.push({
      id: 'bsk-winner-match',
      type: 'result',
      name: 'Vainqueur du Match (Prolongations incluses)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-bsk-1', name: event.homeTeam, odds: probToFlashOdds(pHome), isSuspended: isMatchCompleted },
        { id: 'sel-bsk-2', name: event.awayTeam, odds: probToFlashOdds(1 - pHome), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Total Points Match (Plus / Moins de 212.5, 220.5, 228.5)
    const totalThresholds = [208.5, 218.5, 228.5];
    for (const threshold of totalThresholds) {
      const alreadyExceeded = score.total > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;
      const remMinutes = Math.max(0, 48 - elapsedMinutes);
      const expectedTotal = score.total + remMinutes * 4.6;
      const pOver = alreadyExceeded ? 1.0 : isMatchCompleted ? 0.0 : Math.min(0.95, Math.max(0.05, 0.5 + (expectedTotal - threshold) * 0.03));

      markets.push({
        id: `bsk-total-points-${threshold}`,
        type: 'goals',
        name: `Total Points Match (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          { id: `sel-bsk-ov-${threshold}`, name: `Plus de ${threshold}`, odds: probToFlashOdds(pOver), isSuspended },
          { id: `sel-bsk-un-${threshold}`, name: `Moins de ${threshold}`, odds: probToFlashOdds(1 - pOver), isSuspended },
        ],
      });
    }

    // 3. Quarts-Temps Q1, Q2, Q3, Q4 (Vainqueur, Total, Handicap)
    const quarters = [
      { num: 1, endMin: 12, label: '1er Quart-Temps (Q1)' },
      { num: 2, endMin: 24, label: '2e Quart-Temps (Q2)' },
      { num: 3, endMin: 36, label: '3e Quart-Temps (Q3)' },
      { num: 4, endMin: 48, label: '4e Quart-Temps (Q4)' },
    ];

    for (const q of quarters) {
      const qExpired = isMatchCompleted || elapsedMinutes >= q.endMin;
      const isCurrentQ = elapsedMinutes < q.endMin && elapsedMinutes >= q.endMin - 12;

      // Vainqueur du Quart-Temps
      markets.push({
        id: `bsk-q${q.num}-winner`,
        type: 'result',
        name: `${q.label} : Vainqueur`,
        isLive: isLive && isCurrentQ,
        isSuspended: qExpired,
        selections: [
          { id: `sel-bsk-q${q.num}-1`, name: event.homeTeam, odds: probToFlashOdds(0.53), isSuspended: qExpired },
          { id: `sel-bsk-q${q.num}-2`, name: event.awayTeam, odds: probToFlashOdds(0.47), isSuspended: qExpired },
        ],
      });

      // Total Points du Quart-Temps (Plus / Moins 53.5)
      markets.push({
        id: `bsk-q${q.num}-total-535`,
        type: 'goals',
        name: `${q.label} : Total Points (Plus / Moins 53.5)`,
        isLive: isLive && isCurrentQ,
        isSuspended: qExpired,
        selections: [
          { id: `sel-bsk-q${q.num}-ov`, name: 'Plus de 53.5', odds: probToFlashOdds(0.51), isSuspended: qExpired },
          { id: `sel-bsk-q${q.num}-un`, name: 'Moins de 53.5', odds: probToFlashOdds(0.49), isSuspended: qExpired },
        ],
      });

      // Handicap du Quart-Temps (+2.5 / -2.5)
      markets.push({
        id: `bsk-q${q.num}-handicap`,
        type: 'handicap',
        name: `${q.label} : Handicap (+2.5 / -2.5)`,
        isLive: isLive && isCurrentQ,
        isSuspended: qExpired,
        selections: [
          { id: `sel-bsk-q${q.num}-h1`, name: `${event.homeTeam} -2.5`, odds: probToFlashOdds(0.50), isSuspended: qExpired },
          { id: `sel-bsk-q${q.num}-h2`, name: `${event.awayTeam} +2.5`, odds: probToFlashOdds(0.50), isSuspended: qExpired },
        ],
      });
    }

    // 4. Mi-Temps MT1 (Q1+Q2) & MT2 (Q3+Q4)
    const mt1Expired = isMatchCompleted || elapsedMinutes >= 24;
    markets.push({
      id: 'bsk-mt1-winner',
      type: 'half_time',
      name: '1re Mi-Temps : Vainqueur',
      isLive: isLive && !mt1Expired,
      isSuspended: mt1Expired,
      selections: [
        { id: 'sel-bsk-mt1-1', name: event.homeTeam, odds: probToFlashOdds(0.54), isSuspended: mt1Expired },
        { id: 'sel-bsk-mt1-2', name: event.awayTeam, odds: probToFlashOdds(0.46), isSuspended: mt1Expired },
      ],
    });

    return markets;
  }

  // ==========================================================================
  // 3. HANDBALL (Vainqueur, Handicaps et Totaux par Période)
  // ==========================================================================
  private static generateHandballMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished || elapsedMinutes >= 60;
    const mt1Expired = isMatchCompleted || elapsedMinutes >= 30;

    // 1. Résultat Match (1N2)
    const diff = score.home - score.away;
    const p1 = isMatchCompleted ? (diff > 0 ? 1.0 : 0.0) : Math.min(0.85, Math.max(0.10, 0.48 + diff * 0.04));
    const pN = isMatchCompleted ? (diff === 0 ? 1.0 : 0.0) : 0.09;
    const p2 = isMatchCompleted ? (diff < 0 ? 1.0 : 0.0) : Math.max(0.06, 1 - p1 - pN);

    markets.push({
      id: 'hb-match-result',
      type: 'result',
      name: 'Résultat du Match (1N2)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-hb-1', name: event.homeTeam, odds: probToFlashOdds(p1), isSuspended: isMatchCompleted },
        { id: 'sel-hb-n', name: 'Match nul', odds: probToFlashOdds(pN), isSuspended: isMatchCompleted },
        { id: 'sel-hb-2', name: event.awayTeam, odds: probToFlashOdds(p2), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Total Buts Match (Plus / Moins de 58.5)
    const threshold = 58.5;
    const alreadyExceeded = score.total > threshold;
    const isSuspendedTotal = isMatchCompleted || alreadyExceeded;
    markets.push({
      id: 'hb-total-585',
      type: 'goals',
      name: `Total Buts Match (Plus / Moins ${threshold})`,
      isLive,
      isSuspended: isSuspendedTotal,
      selections: [
        { id: 'sel-hb-ov', name: `Plus de ${threshold}`, odds: alreadyExceeded ? 1.01 : probToFlashOdds(0.51), isSuspended: isSuspendedTotal },
        { id: 'sel-hb-un', name: `Moins de ${threshold}`, odds: alreadyExceeded ? 40.0 : probToFlashOdds(0.49), isSuspended: isSuspendedTotal },
      ],
    });

    // 3. Handicap Match (+2.5 / -2.5)
    markets.push({
      id: 'hb-handicap-match',
      type: 'handicap',
      name: 'Handicap Buts Match (+2.5 / -2.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-hb-h1', name: `${event.homeTeam} -2.5`, odds: probToFlashOdds(0.50), isSuspended: isMatchCompleted },
        { id: 'sel-hb-h2', name: `${event.awayTeam} +2.5`, odds: probToFlashOdds(0.50), isSuspended: isMatchCompleted },
      ],
    });

    // 4. 1re Mi-Temps (MT1)
    markets.push({
      id: 'hb-mt1-result',
      type: 'half_time',
      name: '1re Mi-Temps : Résultat (1N2)',
      isLive: isLive && !mt1Expired,
      isSuspended: mt1Expired,
      selections: [
        { id: 'sel-hb-mt1-1', name: event.homeTeam, odds: probToFlashOdds(0.46), isSuspended: mt1Expired },
        { id: 'sel-hb-mt1-n', name: 'Nul', odds: probToFlashOdds(0.14), isSuspended: mt1Expired },
        { id: 'sel-hb-mt1-2', name: event.awayTeam, odds: probToFlashOdds(0.40), isSuspended: mt1Expired },
      ],
    });

    markets.push({
      id: 'hb-mt1-total-295',
      type: 'half_time',
      name: '1re Mi-Temps : Total Buts (Plus / Moins 29.5)',
      isLive: isLive && !mt1Expired,
      isSuspended: mt1Expired || score.total > 29.5,
      selections: [
        { id: 'sel-hb-mt1-ov', name: 'Plus de 29.5', odds: probToFlashOdds(0.50), isSuspended: mt1Expired },
        { id: 'sel-hb-mt1-un', name: 'Moins de 29.5', odds: probToFlashOdds(0.50), isSuspended: mt1Expired },
      ],
    });

    return markets;
  }

  // ==========================================================================
  // 4. VOLLEYBALL (Vainqueur, Handicaps et Totaux par Set)
  // ==========================================================================
  private static generateVolleyballMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished || score.home >= 3 || score.away >= 3;

    // 1. Vainqueur Match
    const pHome = isMatchCompleted ? (score.home > score.away ? 1.0 : 0.0) : 0.52;
    markets.push({
      id: 'vb-winner-match',
      type: 'result',
      name: 'Vainqueur du Match (Sets)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-vb-1', name: event.homeTeam, odds: probToFlashOdds(pHome), isSuspended: isMatchCompleted },
        { id: 'sel-vb-2', name: event.awayTeam, odds: probToFlashOdds(1 - pHome), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Total Sets Match (Plus / Moins 3.5, 4.5)
    markets.push({
      id: 'vb-total-sets-35',
      type: 'goals',
      name: 'Nombre Total de Sets (Plus / Moins 3.5)',
      isLive,
      isSuspended: isMatchCompleted || score.total > 3.5,
      selections: [
        { id: 'sel-vb-s-ov', name: 'Plus de 3.5 sets', odds: probToFlashOdds(0.68), isSuspended: isMatchCompleted },
        { id: 'sel-vb-s-un', name: 'Moins de 3.5 sets (3-0)', odds: probToFlashOdds(0.32), isSuspended: isMatchCompleted },
      ],
    });

    // 3. Marchés par Set (Set 1, Set 2, Set 3)
    const sets = [
      { num: 1, label: '1er Set' },
      { num: 2, label: '2e Set' },
      { num: 3, label: '3e Set' },
    ];

    for (const s of sets) {
      // Auto-élagage : si le nombre de sets joués est supérieur au numéro de set, il est terminé
      const setCompleted = isMatchCompleted || score.total >= s.num;
      markets.push({
        id: `vb-set${s.num}-winner`,
        type: 'result',
        name: `${s.label} : Vainqueur`,
        isLive: isLive && score.total === s.num - 1,
        isSuspended: setCompleted,
        selections: [
          { id: `sel-vb-s${s.num}-1`, name: event.homeTeam, odds: probToFlashOdds(0.53), isSuspended: setCompleted },
          { id: `sel-vb-s${s.num}-2`, name: event.awayTeam, odds: probToFlashOdds(0.47), isSuspended: setCompleted },
        ],
      });

      markets.push({
        id: `vb-set${s.num}-total-455`,
        type: 'goals',
        name: `${s.label} : Total Points (Plus / Moins 45.5)`,
        isLive: isLive && score.total === s.num - 1,
        isSuspended: setCompleted,
        selections: [
          { id: `sel-vb-s${s.num}-ov`, name: 'Plus de 45.5 pts', odds: probToFlashOdds(0.52), isSuspended: setCompleted },
          { id: `sel-vb-s${s.num}-un`, name: 'Moins de 45.5 pts', odds: probToFlashOdds(0.48), isSuspended: setCompleted },
        ],
      });
    }

    return markets;
  }

  // ==========================================================================
  // 5. HOCKEY SUR GLACE (Totaux Buts Global & par Tiers-Temps Pér. 1, 2, 3)
  // ==========================================================================
  private static generateHockeyMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished || elapsedMinutes >= 60;

    // 1. Résultat Temps Réglementaire (1N2)
    const diff = score.home - score.away;
    const p1 = isMatchCompleted ? (diff > 0 ? 1.0 : 0.0) : Math.min(0.85, Math.max(0.10, 0.45 + diff * 0.06));
    const pN = isMatchCompleted ? (diff === 0 ? 1.0 : 0.0) : 0.22;
    const p2 = isMatchCompleted ? (diff < 0 ? 1.0 : 0.0) : Math.max(0.08, 1 - p1 - pN);

    markets.push({
      id: 'hk-match-1x2',
      type: 'result',
      name: 'Résultat 60 Minutes (1N2)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-hk-1', name: event.homeTeam, odds: probToFlashOdds(p1), isSuspended: isMatchCompleted },
        { id: 'sel-hk-n', name: 'Match nul (Prolongation)', odds: probToFlashOdds(pN), isSuspended: isMatchCompleted },
        { id: 'sel-hk-2', name: event.awayTeam, odds: probToFlashOdds(p2), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Vainqueur Prolongations & Tirs au But inclus
    const pOtHome = Math.min(0.96, Math.max(0.04, 0.52 + diff * 0.07));
    markets.push({
      id: 'hk-winner-ot',
      type: 'result',
      name: 'Vainqueur Final (Prolongations & TAB inclus)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-hk-ot-1', name: event.homeTeam, odds: probToFlashOdds(pOtHome), isSuspended: isMatchCompleted },
        { id: 'sel-hk-ot-2', name: event.awayTeam, odds: probToFlashOdds(1 - pOtHome), isSuspended: isMatchCompleted },
      ],
    });

    // 3. Totaux Buts Global (Plus / Moins de 4.5, 5.5, 6.5)
    const thresholds = [4.5, 5.5, 6.5];
    for (const threshold of thresholds) {
      const alreadyExceeded = score.total > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;
      const remFraction = isMatchCompleted ? 0 : Math.max(0, 60 - elapsedMinutes) / 60;
      const remLambda = Math.max(0.1, 5.2 * remFraction);
      const needed = Math.max(0, Math.ceil(threshold) - score.total);
      const pOver = alreadyExceeded ? 1.0 : isMatchCompleted ? 0.0 : Math.max(0.02, 1 - cumulativePoisson(needed - 1, remLambda));

      markets.push({
        id: `hk-total-${threshold}`,
        type: 'goals',
        name: `Total Buts Match (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          { id: `sel-hk-ov-${threshold}`, name: `Plus de ${threshold}`, odds: alreadyExceeded ? 1.01 : probToFlashOdds(pOver), isSuspended },
          { id: `sel-hk-un-${threshold}`, name: `Moins de ${threshold}`, odds: alreadyExceeded ? 40.0 : probToFlashOdds(1 - pOver), isSuspended },
        ],
      });
    }

    // 4. Par Tiers-Temps (Pér. 1, Pér. 2, Pér. 3)
    const periods = [
      { num: 1, endMin: 20, label: '1er Tiers-Temps (Pér. 1)' },
      { num: 2, endMin: 40, label: '2e Tiers-Temps (Pér. 2)' },
      { num: 3, endMin: 60, label: '3e Tiers-Temps (Pér. 3)' },
    ];

    for (const p of periods) {
      const pExpired = isMatchCompleted || elapsedMinutes >= p.endMin;
      const isCurrentP = elapsedMinutes < p.endMin && elapsedMinutes >= p.endMin - 20;

      // Résultat du tiers-temps (1N2)
      markets.push({
        id: `hk-p${p.num}-result`,
        type: 'half_time',
        name: `${p.label} : Résultat (1N2)`,
        isLive: isLive && isCurrentP,
        isSuspended: pExpired,
        selections: [
          { id: `sel-hk-p${p.num}-1`, name: event.homeTeam, odds: probToFlashOdds(0.42), isSuspended: pExpired },
          { id: `sel-hk-p${p.num}-n`, name: 'Nul', odds: probToFlashOdds(0.28), isSuspended: pExpired },
          { id: `sel-hk-p${p.num}-2`, name: event.awayTeam, odds: probToFlashOdds(0.30), isSuspended: pExpired },
        ],
      });

      // Total Buts du tiers-temps (Plus / Moins 1.5)
      markets.push({
        id: `hk-p${p.num}-total-15`,
        type: 'goals',
        name: `${p.label} : Total Buts (Plus / Moins 1.5)`,
        isLive: isLive && isCurrentP,
        isSuspended: pExpired,
        selections: [
          { id: `sel-hk-p${p.num}-ov`, name: 'Plus de 1.5', odds: probToFlashOdds(0.54), isSuspended: pExpired },
          { id: `sel-hk-p${p.num}-un`, name: 'Moins de 1.5', odds: probToFlashOdds(0.46), isSuspended: pExpired },
        ],
      });
    }

    return markets;
  }

  // ==========================================================================
  // 6. TENNIS (Vainqueur Match, Sets, Total Jeux & Handicap)
  // ==========================================================================
  private static generateTennisMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished || score.home >= 2 || score.away >= 2;

    // 1. Vainqueur Match (1-2)
    const diff = score.home - score.away;
    const pHome = isMatchCompleted ? (diff > 0 ? 1.0 : 0.0) : Math.min(0.92, Math.max(0.08, 0.52 + diff * 0.22));

    markets.push({
      id: 'ten-winner-match',
      type: 'result',
      name: 'Vainqueur du Match (1-2)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-ten-1', name: event.homeTeam, odds: probToFlashOdds(pHome), isSuspended: isMatchCompleted },
        { id: 'sel-ten-2', name: event.awayTeam, odds: probToFlashOdds(1 - pHome), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Total Sets (Plus / Moins 2.5 sets)
    markets.push({
      id: 'ten-total-sets-25',
      type: 'goals',
      name: 'Total Sets (Plus / Moins 2.5 sets)',
      isLive,
      isSuspended: isMatchCompleted || (score.home === 1 && score.away === 1),
      selections: [
        { id: 'sel-ten-s-ov', name: 'Plus de 2.5 sets (3 sets)', odds: probToFlashOdds(0.48), isSuspended: isMatchCompleted },
        { id: 'sel-ten-s-un', name: 'Moins de 2.5 sets (2-0)', odds: probToFlashOdds(0.52), isSuspended: isMatchCompleted },
      ],
    });

    // 3. Vainqueur Set 1
    const set1Finished = isMatchCompleted || score.total >= 1;
    markets.push({
      id: 'ten-set1-winner',
      type: 'result',
      name: 'Vainqueur 1er Set',
      isLive: isLive && score.total === 0,
      isSuspended: set1Finished,
      selections: [
        { id: 'sel-ten-s1-1', name: event.homeTeam, odds: probToFlashOdds(0.52), isSuspended: set1Finished },
        { id: 'sel-ten-s1-2', name: event.awayTeam, odds: probToFlashOdds(0.48), isSuspended: set1Finished },
      ],
    });

    // 4. Total Jeux Match (Plus / Moins 21.5)
    markets.push({
      id: 'ten-total-games-215',
      type: 'goals',
      name: 'Total Jeux Match (Plus / Moins 21.5 jeux)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-ten-g-ov', name: 'Plus de 21.5 jeux', odds: probToFlashOdds(0.51), isSuspended: isMatchCompleted },
        { id: 'sel-ten-g-un', name: 'Moins de 21.5 jeux', odds: probToFlashOdds(0.49), isSuspended: isMatchCompleted },
      ],
    });

    return markets;
  }

  // ==========================================================================
  // 7. CRICKET (Vainqueur, Runs Match/Équipe/Overs, Wickets, 4s & 6s)
  // ==========================================================================
  private static generateCricketMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished;

    // Estimation des overs joués (approx 3.5 - 4 min par over en T20/ODI)
    const estimatedOvers = isMatchCompleted ? 40 : Math.min(40, Math.floor(elapsedMinutes / 3.8));
    const isSecondInnings = estimatedOvers >= 20 || (event.period || '').toLowerCase().includes('2nd');

    // 1. Vainqueur du Match
    const pHome = isMatchCompleted
      ? (score.home > score.away ? 1.0 : 0.0)
      : Math.min(0.92, Math.max(0.08, 0.53 + (score.home - score.away) * 0.003));

    markets.push({
      id: 'cric-winner-match',
      type: 'result',
      name: 'Vainqueur du Match',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-cric-1', name: event.homeTeam, odds: probToFlashOdds(pHome), isSuspended: isMatchCompleted },
        { id: 'sel-cric-2', name: event.awayTeam, odds: probToFlashOdds(1 - pHome), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Total Runs (Plus / Moins) : Match
    const matchRunsThresholds = [310.5, 335.5, 360.5];
    for (const threshold of matchRunsThresholds) {
      const alreadyExceeded = score.total > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;
      const remOvers = Math.max(0, 40 - estimatedOvers);
      const expectedTotalRuns = score.total + remOvers * 8.2;
      const pOver = alreadyExceeded ? 1.0 : isMatchCompleted ? 0.0 : Math.min(0.94, Math.max(0.06, 0.5 + (expectedTotalRuns - threshold) * 0.015));

      markets.push({
        id: `cric-total-runs-${threshold}`,
        type: 'goals',
        name: `Total Runs Match (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          { id: `sel-cric-ov-${threshold}`, name: `Plus de ${threshold}`, odds: alreadyExceeded ? 1.01 : probToFlashOdds(pOver), isSuspended },
          { id: `sel-cric-un-${threshold}`, name: `Moins de ${threshold}`, odds: alreadyExceeded ? 40.0 : probToFlashOdds(1 - pOver), isSuspended },
        ],
      });
    }

    // 3. Total Runs par Équipe (Home & Away)
    const teamRunsThreshold = 165.5;
    // Domicile
    const homeExceeded = score.home > teamRunsThreshold;
    const homeSuspended = isMatchCompleted || homeExceeded;
    markets.push({
      id: 'cric-runs-home-165',
      type: 'goals',
      name: `Total Runs ${event.homeTeam} (Plus / Moins ${teamRunsThreshold})`,
      isLive,
      isSuspended: homeSuspended,
      selections: [
        { id: 'sel-cric-home-ov', name: `Plus de ${teamRunsThreshold}`, odds: homeExceeded ? 1.01 : probToFlashOdds(0.52), isSuspended: homeSuspended },
        { id: 'sel-cric-home-un', name: `Moins de ${teamRunsThreshold}`, odds: homeExceeded ? 40.0 : probToFlashOdds(0.48), isSuspended: homeSuspended },
      ],
    });

    // Extérieur
    const awayExceeded = score.away > teamRunsThreshold;
    const awaySuspended = isMatchCompleted || awayExceeded;
    markets.push({
      id: 'cric-runs-away-165',
      type: 'goals',
      name: `Total Runs ${event.awayTeam} (Plus / Moins ${teamRunsThreshold})`,
      isLive,
      isSuspended: awaySuspended,
      selections: [
        { id: 'sel-cric-away-ov', name: `Plus de ${teamRunsThreshold}`, odds: awayExceeded ? 1.01 : probToFlashOdds(0.50), isSuspended: awaySuspended },
        { id: 'sel-cric-away-un', name: `Moins de ${teamRunsThreshold}`, odds: awayExceeded ? 40.0 : probToFlashOdds(0.50), isSuspended: awaySuspended },
      ],
    });

    // 4. Tranches d'Overs : Powerplay (0-6 overs), 0-10 overs, 0-20 overs
    const overBands = [
      { maxOver: 6, label: 'Powerplay (0 - 6 Overs)', threshold: 48.5 },
      { maxOver: 10, label: 'Premiers 10 Overs', threshold: 82.5 },
      { maxOver: 20, label: '1re Manche (0 - 20 Overs)', threshold: 168.5 },
    ];

    for (const band of overBands) {
      // Auto-élagage : si les overs actuels dépassent la tranche, le marché est expiré/fermé
      const isBandExpired = isMatchCompleted || estimatedOvers >= band.maxOver;
      const isCurrentBand = estimatedOvers < band.maxOver;

      markets.push({
        id: `cric-overs-${band.maxOver}-total`,
        type: 'intervals',
        name: `${band.label} : Total Runs (Plus / Moins ${band.threshold})`,
        isLive: isLive && isCurrentBand,
        isSuspended: isBandExpired,
        selections: [
          { id: `sel-cric-ob-${band.maxOver}-ov`, name: `Plus de ${band.threshold}`, odds: isBandExpired ? 1.01 : probToFlashOdds(0.52), isSuspended: isBandExpired },
          { id: `sel-cric-ob-${band.maxOver}-un`, name: `Moins de ${band.threshold}`, odds: isBandExpired ? 40.0 : probToFlashOdds(0.48), isSuspended: isBandExpired },
        ],
      });
    }

    // 5. Total Wickets & Méthode du Prochain Wicket
    markets.push({
      id: 'cric-total-wickets-125',
      type: 'goals',
      name: 'Total Wickets Match (Plus / Moins 12.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-cric-w-ov', name: 'Plus de 12.5 Wickets', odds: probToFlashOdds(0.52), isSuspended: isMatchCompleted },
        { id: 'sel-cric-w-un', name: 'Moins de 12.5 Wickets', odds: probToFlashOdds(0.48), isSuspended: isMatchCompleted },
      ],
    });

    markets.push({
      id: 'cric-next-wicket-method',
      type: 'exact_score',
      name: 'Méthode du Prochain Wicket (Tombée de guichet)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-cric-wm-caught', name: 'Attrapé (Caught)', odds: probToFlashOdds(0.60), isSuspended: isMatchCompleted },
        { id: 'sel-cric-wm-bowled', name: 'Lancé (Bowled)', odds: probToFlashOdds(0.20), isSuspended: isMatchCompleted },
        { id: 'sel-cric-wm-lbw', name: 'Jambe avant guichet (LBW)', odds: probToFlashOdds(0.12), isSuspended: isMatchCompleted },
        { id: 'sel-cric-wm-runout', name: 'Éliminé à la course (Run Out / Stumped)', odds: probToFlashOdds(0.08), isSuspended: isMatchCompleted },
      ],
    });

    // 6. Total de 4s et 6s (Boundaries & Sixes - Match et par Équipe)
    markets.push({
      id: 'cric-total-sixes-115',
      type: 'goals',
      name: 'Total Sixes (6s) dans le Match (Plus / Moins 11.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-cric-6s-ov', name: 'Plus de 11.5 Sixes', odds: probToFlashOdds(0.53), isSuspended: isMatchCompleted },
        { id: 'sel-cric-6s-un', name: 'Moins de 11.5 Sixes', odds: probToFlashOdds(0.47), isSuspended: isMatchCompleted },
      ],
    });

    markets.push({
      id: 'cric-total-fours-265',
      type: 'goals',
      name: 'Total Boundaries (4s) dans le Match (Plus / Moins 26.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-cric-4s-ov', name: 'Plus de 26.5 Fours', odds: probToFlashOdds(0.51), isSuspended: isMatchCompleted },
        { id: 'sel-cric-4s-un', name: 'Moins de 26.5 Fours', odds: probToFlashOdds(0.49), isSuspended: isMatchCompleted },
      ],
    });

    markets.push({
      id: 'cric-most-sixes-team',
      type: 'result',
      name: 'Équipe avec le plus de Sixes (6s)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-cric-ms-1', name: event.homeTeam, odds: probToFlashOdds(0.46), isSuspended: isMatchCompleted },
        { id: 'sel-cric-ms-tie', name: 'Égalité', odds: probToFlashOdds(0.16), isSuspended: isMatchCompleted },
        { id: 'sel-cric-ms-2', name: event.awayTeam, odds: probToFlashOdds(0.38), isSuspended: isMatchCompleted },
      ],
    });

    return markets;
  }

  // ==========================================================================
  // 8. FOOTBALL AMÉRICAIN (NFL) (Vainqueur, Handicaps, Points, Touchdowns)
  // ==========================================================================
  private static generateAmericanFootballMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished || elapsedMinutes >= 60;

    // 1. Vainqueur Match (Moneyline)
    const diff = score.home - score.away;
    const pHome = isMatchCompleted ? (diff > 0 ? 1.0 : 0.0) : Math.min(0.95, Math.max(0.05, 0.52 + diff * 0.025));

    markets.push({
      id: 'af-winner-match',
      type: 'result',
      name: 'Vainqueur du Match (Prolongations incluses)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-af-1', name: event.homeTeam, odds: probToFlashOdds(pHome), isSuspended: isMatchCompleted },
        { id: 'sel-af-2', name: event.awayTeam, odds: probToFlashOdds(1 - pHome), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Handicaps Écart de Points (+3.5 / -3.5, +6.5 / -6.5)
    markets.push({
      id: 'af-handicap-35',
      type: 'handicap',
      name: 'Écart de Points (Handicap +/- 3.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-af-h1', name: `${event.homeTeam} -3.5`, odds: probToFlashOdds(0.50), isSuspended: isMatchCompleted },
        { id: 'sel-af-h2', name: `${event.awayTeam} +3.5`, odds: probToFlashOdds(0.50), isSuspended: isMatchCompleted },
      ],
    });

    // 3. Total Points Match (Plus / Moins de 44.5, 47.5, 51.5)
    const totalThresholds = [44.5, 47.5, 51.5];
    for (const threshold of totalThresholds) {
      const alreadyExceeded = score.total > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;
      const remMins = Math.max(0, 60 - elapsedMinutes);
      const expectedTotal = score.total + remMins * 0.78;
      const pOver = alreadyExceeded ? 1.0 : isMatchCompleted ? 0.0 : Math.min(0.94, Math.max(0.06, 0.5 + (expectedTotal - threshold) * 0.03));

      markets.push({
        id: `af-total-pts-${threshold}`,
        type: 'goals',
        name: `Total Points Match (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          { id: `sel-af-ov-${threshold}`, name: `Plus de ${threshold}`, odds: alreadyExceeded ? 1.01 : probToFlashOdds(pOver), isSuspended },
          { id: `sel-af-un-${threshold}`, name: `Moins de ${threshold}`, odds: alreadyExceeded ? 40.0 : probToFlashOdds(1 - pOver), isSuspended },
        ],
      });
    }

    // 4. Mi-Temps & Quart-Temps (Auto-élagage)
    const quarters = [
      { num: 1, endMin: 15, label: '1er Quart-Temps (Q1)' },
      { num: 2, endMin: 30, label: '2e Quart-Temps (Q2)' },
      { num: 3, endMin: 45, label: '3e Quart-Temps (Q3)' },
      { num: 4, endMin: 60, label: '4e Quart-Temps (Q4)' },
    ];

    for (const q of quarters) {
      const qExpired = isMatchCompleted || elapsedMinutes >= q.endMin;
      const isCurrentQ = elapsedMinutes < q.endMin && elapsedMinutes >= q.endMin - 15;

      markets.push({
        id: `af-q${q.num}-winner`,
        type: 'result',
        name: `${q.label} : Vainqueur`,
        isLive: isLive && isCurrentQ,
        isSuspended: qExpired,
        selections: [
          { id: `sel-af-q${q.num}-1`, name: event.homeTeam, odds: probToFlashOdds(0.52), isSuspended: qExpired },
          { id: `sel-af-q${q.num}-2`, name: event.awayTeam, odds: probToFlashOdds(0.48), isSuspended: qExpired },
        ],
      });
    }

    // 1re Mi-Temps MT1
    const mt1Expired = isMatchCompleted || elapsedMinutes >= 30;
    markets.push({
      id: 'af-mt1-winner',
      type: 'half_time',
      name: '1re Mi-Temps (MT1) : Vainqueur',
      isLive: isLive && !mt1Expired,
      isSuspended: mt1Expired,
      selections: [
        { id: 'sel-af-mt1-1', name: event.homeTeam, odds: probToFlashOdds(0.53), isSuspended: mt1Expired },
        { id: 'sel-af-mt1-2', name: event.awayTeam, odds: probToFlashOdds(0.47), isSuspended: mt1Expired },
      ],
    });

    // 5. Touchdowns (Total de Touchdowns & Prochain Touchdown)
    markets.push({
      id: 'af-total-touchdowns-55',
      type: 'goals',
      name: 'Nombre Total de Touchdowns (Plus / Moins 5.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-af-td-ov', name: 'Plus de 5.5 Touchdowns', odds: probToFlashOdds(0.51), isSuspended: isMatchCompleted },
        { id: 'sel-af-td-un', name: 'Moins de 5.5 Touchdowns', odds: probToFlashOdds(0.49), isSuspended: isMatchCompleted },
      ],
    });

    markets.push({
      id: 'af-next-touchdown-team',
      type: 'exact_score',
      name: 'Prochaine équipe à marquer un Touchdown',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-af-ntd-1', name: event.homeTeam, odds: probToFlashOdds(0.51), isSuspended: isMatchCompleted },
        { id: 'sel-af-ntd-2', name: event.awayTeam, odds: probToFlashOdds(0.45), isSuspended: isMatchCompleted },
        { id: 'sel-af-ntd-none', name: 'Aucun Touchdown additionnel', odds: isMatchCompleted ? 1.01 : probToFlashOdds(0.04), isSuspended: isMatchCompleted },
      ],
    });

    return markets;
  }

  // ==========================================================================
  // 9. RUGBY (Vainqueur 1N2, Handicaps, Total Points, Essais)
  // ==========================================================================
  private static generateRugbyMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished || elapsedMinutes >= 80;
    const mt1Expired = isMatchCompleted || elapsedMinutes >= 40;

    // 1. Résultat Match (1N2)
    const diff = score.home - score.away;
    const p1 = isMatchCompleted ? (diff > 0 ? 1.0 : 0.0) : Math.min(0.90, Math.max(0.08, 0.54 + diff * 0.03));
    const pN = isMatchCompleted ? (diff === 0 ? 1.0 : 0.0) : 0.05;
    const p2 = isMatchCompleted ? (diff < 0 ? 1.0 : 0.0) : Math.max(0.05, 1 - p1 - pN);

    markets.push({
      id: 'rug-result-1n2',
      type: 'result',
      name: 'Résultat du Match (1N2)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-rug-1', name: event.homeTeam, odds: probToFlashOdds(p1), isSuspended: isMatchCompleted },
        { id: 'sel-rug-n', name: 'Match nul', odds: probToFlashOdds(pN), isSuspended: isMatchCompleted },
        { id: 'sel-rug-2', name: event.awayTeam, odds: probToFlashOdds(p2), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Handicap Points Match (+6.5 / -6.5)
    markets.push({
      id: 'rug-handicap-65',
      type: 'handicap',
      name: 'Handicap Points (+6.5 / -6.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-rug-h1', name: `${event.homeTeam} -6.5`, odds: probToFlashOdds(0.50), isSuspended: isMatchCompleted },
        { id: 'sel-rug-h2', name: `${event.awayTeam} +6.5`, odds: probToFlashOdds(0.50), isSuspended: isMatchCompleted },
      ],
    });

    // 3. Total Points Match (Plus / Moins 43.5, 48.5)
    const totalThresholds = [43.5, 48.5];
    for (const threshold of totalThresholds) {
      const alreadyExceeded = score.total > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;

      markets.push({
        id: `rug-total-pts-${threshold}`,
        type: 'goals',
        name: `Total Points Match (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          { id: `sel-rug-ov-${threshold}`, name: `Plus de ${threshold}`, odds: alreadyExceeded ? 1.01 : probToFlashOdds(0.51), isSuspended },
          { id: `sel-rug-un-${threshold}`, name: `Moins de ${threshold}`, odds: alreadyExceeded ? 40.0 : probToFlashOdds(0.49), isSuspended },
        ],
      });
    }

    // 4. 1re Mi-Temps MT1
    markets.push({
      id: 'rug-mt1-result',
      type: 'half_time',
      name: '1re Mi-Temps : Résultat (1N2)',
      isLive: isLive && !mt1Expired,
      isSuspended: mt1Expired,
      selections: [
        { id: 'sel-rug-mt1-1', name: event.homeTeam, odds: probToFlashOdds(0.52), isSuspended: mt1Expired },
        { id: 'sel-rug-mt1-n', name: 'Nul', odds: probToFlashOdds(0.08), isSuspended: mt1Expired },
        { id: 'sel-rug-mt1-2', name: event.awayTeam, odds: probToFlashOdds(0.40), isSuspended: mt1Expired },
      ],
    });

    // 5. Total Essais (Tries) dans le Match
    markets.push({
      id: 'rug-total-tries-45',
      type: 'goals',
      name: 'Total Essais dans le Match (Plus / Moins 4.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-rug-tr-ov', name: 'Plus de 4.5 Essais', odds: probToFlashOdds(0.52), isSuspended: isMatchCompleted },
        { id: 'sel-rug-tr-un', name: 'Moins de 4.5 Essais', odds: probToFlashOdds(0.48), isSuspended: isMatchCompleted },
      ],
    });

    return markets;
  }

  // ==========================================================================
  // 10. TENNIS DE TABLE (Vainqueur, Total Sets, Total Points)
  // ==========================================================================
  private static generateTableTennisMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished || score.home >= 3 || score.away >= 3;

    // 1. Vainqueur Match
    const pHome = isMatchCompleted ? (score.home > score.away ? 1.0 : 0.0) : 0.52;
    markets.push({
      id: 'tt-winner-match',
      type: 'result',
      name: 'Vainqueur du Match',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-tt-1', name: event.homeTeam, odds: probToFlashOdds(pHome), isSuspended: isMatchCompleted },
        { id: 'sel-tt-2', name: event.awayTeam, odds: probToFlashOdds(1 - pHome), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Total Sets (Plus / Moins 4.5 sets)
    markets.push({
      id: 'tt-total-sets-45',
      type: 'goals',
      name: 'Nombre Total de Sets (Plus / Moins 4.5 sets)',
      isLive,
      isSuspended: isMatchCompleted || score.total > 4.5,
      selections: [
        { id: 'sel-tt-sov', name: 'Plus de 4.5 sets (Match en 5+)', odds: probToFlashOdds(0.60), isSuspended: isMatchCompleted },
        { id: 'sel-tt-sun', name: 'Moins de 4.5 sets (3-0 ou 3-1)', odds: probToFlashOdds(0.40), isSuspended: isMatchCompleted },
      ],
    });

    // 3. Set 1 & Set 2 Vainqueur
    const set1Finished = isMatchCompleted || score.total >= 1;
    markets.push({
      id: 'tt-set1-winner',
      type: 'result',
      name: 'Vainqueur 1er Set',
      isLive: isLive && score.total === 0,
      isSuspended: set1Finished,
      selections: [
        { id: 'sel-tt-s1-1', name: event.homeTeam, odds: probToFlashOdds(0.53), isSuspended: set1Finished },
        { id: 'sel-tt-s1-2', name: event.awayTeam, odds: probToFlashOdds(0.47), isSuspended: set1Finished },
      ],
    });

    // 4. Total Points Match (Plus / Moins 74.5)
    markets.push({
      id: 'tt-total-points-745',
      type: 'goals',
      name: 'Total Points Match (Plus / Moins 74.5)',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-tt-pov', name: 'Plus de 74.5 points', odds: probToFlashOdds(0.51), isSuspended: isMatchCompleted },
        { id: 'sel-tt-pun', name: 'Moins de 74.5 points', odds: probToFlashOdds(0.49), isSuspended: isMatchCompleted },
      ],
    });

    return markets;
  }

  // ==========================================================================
  // 11. MMA & BOXE (Vainqueur, Totaux de Rounds, Méthode de Victoire)
  // ==========================================================================
  private static generateMmaBoxingMarkets(
    event: SportEvent,
    score: { home: number; away: number; total: number },
    elapsedMinutes: number,
    isLive: boolean,
    isFinished: boolean
  ): Market[] {
    const markets: Market[] = [];
    const isMatchCompleted = isFinished;
    const currentRound = Math.min(5, Math.floor(elapsedMinutes / 5) + 1);

    // 1. Vainqueur du Combat
    markets.push({
      id: 'mma-winner-match',
      type: 'result',
      name: 'Vainqueur du Combat',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-mma-1', name: event.homeTeam, odds: probToFlashOdds(0.55), isSuspended: isMatchCompleted },
        { id: 'sel-mma-2', name: event.awayTeam, odds: probToFlashOdds(0.45), isSuspended: isMatchCompleted },
      ],
    });

    // 2. Méthode de Victoire
    markets.push({
      id: 'mma-method-victory',
      type: 'exact_score',
      name: 'Méthode de Victoire',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-mma-ko', name: 'KO / TKO ou Disqualification', odds: probToFlashOdds(0.42), isSuspended: isMatchCompleted },
        { id: 'sel-mma-sub', name: 'Soumission (Submission)', odds: probToFlashOdds(0.25), isSuspended: isMatchCompleted },
        { id: 'sel-mma-dec', name: 'Décision des Juges (Points)', odds: probToFlashOdds(0.33), isSuspended: isMatchCompleted },
      ],
    });

    // 3. Totaux de Rounds (Plus / Moins 1.5, 2.5 Rounds)
    const roundThresholds = [1.5, 2.5];
    for (const threshold of roundThresholds) {
      const alreadyExceeded = currentRound > threshold;
      const isSuspended = isMatchCompleted || alreadyExceeded;

      markets.push({
        id: `mma-rounds-${threshold}`,
        type: 'goals',
        name: `Nombre Total de Rounds (Plus / Moins ${threshold})`,
        isLive,
        isSuspended,
        selections: [
          { id: `sel-mma-r-ov-${threshold}`, name: `Plus de ${threshold} rounds`, odds: alreadyExceeded ? 1.01 : probToFlashOdds(0.53), isSuspended },
          { id: `sel-mma-r-un-${threshold}`, name: `Moins de ${threshold} rounds`, odds: alreadyExceeded ? 40.0 : probToFlashOdds(0.47), isSuspended },
        ],
      });
    }

    // 4. Le combat ira-t-il jusqu'à la décision ?
    markets.push({
      id: 'mma-goes-the-distance',
      type: 'btts',
      name: 'Le combat ira-t-il au bout des rounds prévus ?',
      isLive,
      isSuspended: isMatchCompleted,
      selections: [
        { id: 'sel-mma-dist-yes', name: 'Oui (Décision)', odds: probToFlashOdds(0.35), isSuspended: isMatchCompleted },
        { id: 'sel-mma-dist-no', name: 'Non (Fin avant la limite)', odds: probToFlashOdds(0.65), isSuspended: isMatchCompleted },
      ],
    });

    return markets;
  }
}

export const marketRegistry = new MarketRegistry();
export default MarketRegistry;
