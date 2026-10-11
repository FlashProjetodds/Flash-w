import { SportEvent, Market, OddSelection } from '../../types';

export interface CriticalEvent {
  eventId: string;
  type: 'var' | 'penalty' | 'match_point' | 'set_point' | 'red_card' | 'wicket' | 'critical_down';
  reason: string;
  affectedMarketTypes?: string[]; // If undefined, suspends all or main dynamic markets
  timestamp: number;
  durationMs?: number; // Automatic expiration of suspension (e.g. 45000ms for VAR)
}

export interface RiskMetrics {
  volatility: number; // 0.0 (calm) to 1.0 (extreme volatility / chaos)
  baseMargin: number; // default e.g. 0.06 (6%)
  adjustedMargin: number; // dynamically adjusted margin e.g. 0.08 to 0.14
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suspendedCount: number;
  reasons: string[];
}

export class RiskManager {
  // Store active critical situations per event
  private activeCriticalEvents: Map<string, CriticalEvent[]> = new Map();

  // Custom margin overrides if needed
  private defaultMargin: number = 0.06; // 6% baseline

  constructor(defaultMargin = 0.06) {
    this.defaultMargin = defaultMargin;
  }

  /**
   * Enregistre un événement critique déclenchant une suspension temporaire
   * (ex: étude VAR, penalty accordé, balle de match/set, carton rouge)
   */
  public registerCriticalEvent(criticalEvent: CriticalEvent): void {
    const existing = this.activeCriticalEvents.get(criticalEvent.eventId) || [];
    // Replace or add
    const filtered = existing.filter(e => e.type !== criticalEvent.type);
    filtered.push({
      ...criticalEvent,
      timestamp: criticalEvent.timestamp || Date.now(),
      durationMs: criticalEvent.durationMs || 45000, // 45s default suspension window
    });
    this.activeCriticalEvents.set(criticalEvent.eventId, filtered);
  }

  /**
   * Lève une situation critique manuellement ou après validation
   */
  public resolveCriticalEvent(eventId: string, type?: CriticalEvent['type']): void {
    if (!type) {
      this.activeCriticalEvents.delete(eventId);
      return;
    }
    const existing = this.activeCriticalEvents.get(eventId);
    if (existing) {
      const remaining = existing.filter(e => e.type !== type);
      if (remaining.length > 0) {
        this.activeCriticalEvents.set(eventId, remaining);
      } else {
        this.activeCriticalEvents.delete(eventId);
      }
    }
  }

  /**
   * Nettoie les événements critiques expirés
   */
  public purgeExpiredEvents(eventId?: string): void {
    const now = Date.now();
    const cleanEvent = (id: string) => {
      const list = this.activeCriticalEvents.get(id);
      if (!list) return;
      const valid = list.filter(item => {
        const expiresAt = item.timestamp + (item.durationMs || 45000);
        return now < expiresAt;
      });
      if (valid.length > 0) {
        this.activeCriticalEvents.set(id, valid);
      } else {
        this.activeCriticalEvents.delete(id);
      }
    };

    if (eventId) {
      cleanEvent(eventId);
    } else {
      for (const id of Array.from(this.activeCriticalEvents.keys())) {
        cleanEvent(id);
      }
    }
  }

  /**
   * Analyse automatique de l'événement pour détecter les situations critiques en direct :
   * - Étude VAR mentionnée dans period/minute/events
   * - Penalty accordé
   * - Balle de match ou set en tennis / tennis de table
   * - Cartons rouges récents
   * - Fin de match imminente (temps additionnel)
   */
  public detectCriticalSituations(event: SportEvent): CriticalEvent[] {
    this.purgeExpiredEvents(event.id);
    const criticalList: CriticalEvent[] = [...(this.activeCriticalEvents.get(event.id) || [])];
    const now = Date.now();

    const textToScan = [
      event.period || '',
      event.minute || '',
      event.elapsedTime || '',
      (event as any).statusText || '',
      (event as any).rawPeriod || '',
      ...((event as any).events || []).map((e: any) => e.text || e.type || ''),
    ].join(' ').toLowerCase();

    // 1. Détection VAR
    if (
      textToScan.includes('var') ||
      textToScan.includes('video review') ||
      textToScan.includes('arbitrage vidéo') ||
      textToScan.includes('consultation var')
    ) {
      if (!criticalList.some(c => c.type === 'var')) {
        criticalList.push({
          eventId: event.id,
          type: 'var',
          reason: 'Étude VAR en cours - Suspicion d’incident critique',
          affectedMarketTypes: ['result', 'goals', 'exact_score', 'handicap', 'intervals', 'btts'],
          timestamp: now,
          durationMs: 60000,
        });
      }
    }

    // 2. Détection Penalty
    if (
      textToScan.includes('penalty') ||
      textToScan.includes('pénalty') ||
      textToScan.includes('pen.') ||
      textToScan.includes('tirs au but')
    ) {
      if (!criticalList.some(c => c.type === 'penalty')) {
        criticalList.push({
          eventId: event.id,
          type: 'penalty',
          reason: 'Penalty accordé - Marchés temporairement suspendus',
          affectedMarketTypes: ['result', 'goals', 'exact_score', 'handicap', 'btts', 'intervals'],
          timestamp: now,
          durationMs: 35000,
        });
      }
    }

    // 3. Détection Balle de Match / Balle de Set (Tennis, Tennis de table, Volleyball)
    const sport = (event.sport || '').toLowerCase();
    if (sport === 'tennis' || sport === 'tennis-de-table' || sport === 'volleyball') {
      const scoreStr = `${event.scoreHome ?? event.score?.home ?? ''}-${event.scoreAway ?? event.score?.away ?? ''} ${textToScan}`;
      const isMatchPoint =
        textToScan.includes('balle de match') ||
        textToScan.includes('match point') ||
        textToScan.includes('mp') ||
        scoreStr.includes('40-a') ||
        scoreStr.includes('a-40');

      const isSetPoint =
        textToScan.includes('balle de set') ||
        textToScan.includes('set point') ||
        textToScan.includes('sp');

      if (isMatchPoint && !criticalList.some(c => c.type === 'match_point')) {
        criticalList.push({
          eventId: event.id,
          type: 'match_point',
          reason: 'Balle de match décisive en cours',
          affectedMarketTypes: ['result', 'handicap', 'exact_score'],
          timestamp: now,
          durationMs: 25000,
        });
      } else if (isSetPoint && !criticalList.some(c => c.type === 'set_point')) {
        criticalList.push({
          eventId: event.id,
          type: 'set_point',
          reason: 'Balle de set décisive en cours',
          affectedMarketTypes: ['result', 'half_time'],
          timestamp: now,
          durationMs: 20000,
        });
      }
    }

    // 4. Détection Cricket: Wicket récent ou DRS review
    if (sport === 'cricket') {
      if (textToScan.includes('drs') || textToScan.includes('review') || textToScan.includes('wicket')) {
        if (!criticalList.some(c => c.type === 'wicket')) {
          criticalList.push({
            eventId: event.id,
            type: 'wicket',
            reason: 'Incident Wicket / DRS en cours',
            affectedMarketTypes: ['cricket_total_runs', 'cricket_runs_powerplay', 'cricket_wickets'],
            timestamp: now,
            durationMs: 30000,
          });
        }
      }
    }

    // Mettre à jour le cache actif
    this.activeCriticalEvents.set(event.id, criticalList);
    return criticalList;
  }

  /**
   * Calcule les métriques de risque, la volatilité et la marge ajustée
   * selon le temps écoulé, le sport et l'intensité du match.
   */
  public evaluateRisk(event: SportEvent): RiskMetrics {
    const elapsedMinutes = this.extractElapsedMinutes(event);
    const sport = (event.sport || 'football').toLowerCase();
    const criticalList = this.detectCriticalSituations(event);
    const scoreHome = event.scoreHome ?? event.score?.home ?? 0;
    const scoreAway = event.scoreAway ?? event.score?.away ?? 0;
    const goalDiff = Math.abs(scoreHome - scoreAway);

    let volatility = 0.1; // Base volatility
    const reasons: string[] = [];

    // Facteur A : Événements critiques en cours
    if (criticalList.length > 0) {
      volatility += 0.45 * criticalList.length;
      reasons.push(...criticalList.map(c => c.reason));
    }

    // Facteur B : Temps écoulé & Moment chaud (Money Time / Fin de match)
    if (sport === 'football' || sport === 'futsal') {
      if (elapsedMinutes >= 85) {
        volatility += 0.35;
        reasons.push(`Fin de match imminente (${elapsedMinutes}e min)`);
      } else if (elapsedMinutes >= 75) {
        volatility += 0.20;
        reasons.push(`Dernier quart d'heure (${elapsedMinutes}e min)`);
      } else if (elapsedMinutes >= 40 && elapsedMinutes <= 45) {
        volatility += 0.15;
        reasons.push(`Fin de première mi-temps (${elapsedMinutes}e min)`);
      }
    } else if (sport === 'basketball') {
      if (elapsedMinutes >= 38) {
        volatility += 0.35;
        reasons.push(`Money Time 4e Quart-temps (${elapsedMinutes} min)`);
      } else if (elapsedMinutes >= 30) {
        volatility += 0.15;
      }
    } else if (sport === 'hockey') {
      if (elapsedMinutes >= 55) {
        volatility += 0.30;
        reasons.push(`3e période fin de match (${elapsedMinutes} min)`);
      }
    }

    // Facteur C : Score serré avec haute tension
    if (goalDiff === 0 && elapsedMinutes > 60) {
      volatility += 0.15;
      reasons.push('Score nul à haute intensité');
    } else if (goalDiff === 1 && elapsedMinutes > 75) {
      volatility += 0.20;
      reasons.push('Écart minimal à l’approche du coup de sifflet final');
    }

    // Borner la volatilité entre 0 et 1
    volatility = Math.min(1.0, Math.max(0.0, volatility));

    // Ajustement dynamique de la marge :
    // Base 6% -> monte jusqu'à 12% ou 14% si volatilité élevée
    // Formule : Marge = baseMargin + (volatility * 0.08)
    const baseMargin = this.defaultMargin;
    const extraMargin = volatility * 0.07; // jusqu'à +7% de marge de sécurité
    const adjustedMargin = parseFloat((baseMargin + extraMargin).toFixed(4));

    let riskLevel: RiskMetrics['riskLevel'] = 'LOW';
    if (volatility >= 0.75) {
      riskLevel = 'CRITICAL';
    } else if (volatility >= 0.5) {
      riskLevel = 'HIGH';
    } else if (volatility >= 0.25) {
      riskLevel = 'MEDIUM';
    }

    return {
      volatility: parseFloat(volatility.toFixed(2)),
      baseMargin,
      adjustedMargin,
      riskLevel,
      suspendedCount: criticalList.length,
      reasons,
    };
  }

  /**
   * Applique les règles de gestion des risques sur les marchés :
   * 1. Passe `isSuspended: true` lors d'événements critiques (VAR, penalty, balle de match).
   * 2. Ajuste la marge des cotes générées en fonction de la volatilité et du temps écoulé.
   */
  public applyRiskManagement(markets: Market[], event: SportEvent): Market[] {
    const risk = this.evaluateRisk(event);
    const criticalEvents = this.activeCriticalEvents.get(event.id) || [];
    const hasCritical = criticalEvents.length > 0;

    return markets.map(market => {
      // Déterminer si ce marché spécifique doit être suspendu
      let shouldSuspend = false;
      let suspensionReason = '';

      if (hasCritical) {
        for (const crit of criticalEvents) {
          if (!crit.affectedMarketTypes || crit.affectedMarketTypes.length === 0) {
            shouldSuspend = true;
            suspensionReason = crit.reason;
            break;
          }
          if (crit.affectedMarketTypes.includes(market.type)) {
            shouldSuspend = true;
            suspensionReason = crit.reason;
            break;
          }
        }
      }

      // Si le marché est suspendu par le RiskManager ou l'était déjà
      const isSuspended = market.isSuspended || shouldSuspend;

      // Ajuster la marge sur les sélections si le marché n'est pas suspendu
      const updatedSelections = market.selections.map(sel => {
        const isSelectionSuspended = sel.isSuspended || isSuspended;

        if (isSelectionSuspended || typeof sel.odds !== 'number' || sel.odds <= 1.01) {
          return {
            ...sel,
            isSuspended: isSelectionSuspended,
          };
        }

        // Si la marge a augmenté par rapport à la marge de base (0.06), appliquer la surcote de sécurité
        // Une marge plus élevée réduit légèrement la cote nette pour amortir le risque
        let adjustedOdds = sel.odds;
        if (risk.adjustedMargin > risk.baseMargin) {
          const marginDelta = risk.adjustedMargin - risk.baseMargin;
          // Facteur de réduction prudent : odds / (1 + delta)
          const newOddsVal = sel.odds / (1 + marginDelta * 0.75);
          adjustedOdds = Math.max(1.02, parseFloat(newOddsVal.toFixed(2)));
        }

        return {
          ...sel,
          odds: adjustedOdds,
          isSuspended: isSelectionSuspended,
        };
      });

      return {
        ...market,
        isSuspended,
        reason: suspensionReason || (market as any).reason,
        selections: updatedSelections,
      };
    });
  }

  private extractElapsedMinutes(event: SportEvent): number {
    if (typeof (event as any).elapsedMinutes === 'number') {
      return (event as any).elapsedMinutes;
    }
    const minuteStr = event.minute || event.elapsedTime || '';
    const match = minuteStr.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 20;
  }
}

export const riskManager = new RiskManager();
