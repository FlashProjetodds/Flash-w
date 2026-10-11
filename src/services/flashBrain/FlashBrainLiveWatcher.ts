import { SportEvent, Market } from '../../types/index';
import { MarketRegistry } from './MarketRegistry';
import { riskManager, RiskManager } from './RiskManager';

export interface LiveGoalDetail {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  side: 'home' | 'away';
  scoreHome: number;
  scoreAway: number;
  message: string;
}

export type LiveBroadcastCallback = (
  events: SportEvent[],
  liveAlerts?: string[],
  goalDetails?: LiveGoalDetail[]
) => void;

export class FlashBrainLiveWatcher {
  private previousEvents: Map<string, SportEvent> = new Map();
  private broadcastCallback: LiveBroadcastCallback | null = null;

  /**
   * Horodatage du passage au statut 'Terminé' pour chaque événement (en ms)
   */
  private finishedEventsTimestamps: Map<string, number> = new Map();

  /**
   * Délai avant purge automatique définitive de la mémoire : 5 minutes (300 000 ms)
   */
  public static readonly FINISHED_PURGE_DELAY_MS: number = 5 * 60 * 1000;

  private purgeTimer: any = null;

  constructor() {
    this.startPeriodicPurgeTimer();
  }

  /**
   * Lance un timer périodique d'élagage pour nettoyer la mémoire
   */
  private startPeriodicPurgeTimer(): void {
    if (this.purgeTimer) return;
    this.purgeTimer = setInterval(() => {
      this.purgeExpiredFinishedEvents();
    }, 30000);
    if (typeof this.purgeTimer?.unref === 'function') {
      this.purgeTimer.unref();
    }
  }

  /**
   * Arrête le timer d'élagage périodique (cleanup)
   */
  public stop(): void {
    if (this.purgeTimer) {
      clearInterval(this.purgeTimer);
      this.purgeTimer = null;
    }
  }

  /**
   * Nettoie les événements terminés depuis plus de 5 minutes de la mémoire
   */
  public purgeExpiredFinishedEvents(): string[] {
    const now = Date.now();
    const purgedIds: string[] = [];

    for (const [id, finishedAt] of this.finishedEventsTimestamps.entries()) {
      if (now - finishedAt >= FlashBrainLiveWatcher.FINISHED_PURGE_DELAY_MS) {
        this.previousEvents.delete(id);
        this.finishedEventsTimestamps.delete(id);
        purgedIds.push(id);
        console.log(`[FlashBrainLiveWatcher] Purge mémoire automatique : match terminé #${id} et ses marchés retirés après 5 minutes.`);
      }
    }

    return purgedIds;
  }

  /**
   * Enregistre un callback de diffusion pour propager instantanément les marchés calculés
   */
  public setBroadcastCallback(callback: LiveBroadcastCallback): void {
    this.broadcastCallback = callback;
  }

  /**
   * Vérifie si un événement a déjà été purgé de la mémoire
   */
  public isEventPurged(eventId: string): boolean {
    return !this.previousEvents.has(eventId) && !this.finishedEventsTimestamps.has(eventId);
  }

  /**
   * Récupère le timestamp où un match est passé en terminé
   */
  public getFinishedTimestamp(eventId: string): number | undefined {
    return this.finishedEventsTimestamps.get(eventId);
  }

  /**
   * Analyse les événements entrants, génère les marchés via MarketRegistry pour les matchs LIVE,
   * applique l'auto-élagage (intervalles expirés, scores exacts invalides),
   * purge automatiquement les matchs terminés depuis 5 minutes et diffuse les mises à jour.
   */
  public processLiveUpdates(currentEvents: SportEvent[]): {
    updatedEvents: SportEvent[];
    liveAlerts: string[];
    goalDetails: LiveGoalDetail[];
  } {
    const liveAlerts: string[] = [];
    const goalDetails: LiveGoalDetail[] = [];
    const now = Date.now();

    // 1. Détection des événements terminés et purge automatique après 5 minutes
    const retainedEvents: SportEvent[] = [];

    for (const event of currentEvents) {
      const isFinished = event.status === 'finished' || (event.status as string) === 'finished';

      if (isFinished) {
        if (!this.finishedEventsTimestamps.has(event.id)) {
          // Premier passage au statut Terminé : horodatage enregistré
          this.finishedEventsTimestamps.set(event.id, now);
        }

        const finishedAt = this.finishedEventsTimestamps.get(event.id)!;
        const elapsedSinceFinished = now - finishedAt;

        // Si 5 minutes se sont écoulées après le passage au statut "Terminé"
        if (elapsedSinceFinished >= FlashBrainLiveWatcher.FINISHED_PURGE_DELAY_MS) {
          // Purger l'événement et ses marchés de la mémoire
          this.previousEvents.delete(event.id);
          this.finishedEventsTimestamps.delete(event.id);
          event.markets = []; // Vider les marchés associés
          console.log(
            `[FlashBrainLiveWatcher] Purge mémoire (5 minutes écoulées) : match #${event.id} (${event.homeTeam} vs ${event.awayTeam}) retiré.`
          );
          continue; // Ne pas retenir dans la liste des événements actifs
        }
      } else {
        // Si le statut n'est plus "finished" (ex: reprise ou report annulé), effacer l'horodatage
        this.finishedEventsTimestamps.delete(event.id);
      }

      retainedEvents.push(event);
    }

    const processedEvents = retainedEvents.map(event => {
      const prev = this.previousEvents.get(event.id);
      const isLive = event.status === 'live' || (event.status as string) === 'LIVE';

      const prevHome =
        event.scoreHome !== undefined && prev?.scoreHome !== undefined
          ? prev.scoreHome
          : prev?.score?.home;
      const currHome =
        event.scoreHome !== undefined ? event.scoreHome : event.score?.home;

      const prevAway =
        event.scoreAway !== undefined && prev?.scoreAway !== undefined
          ? prev.scoreAway
          : prev?.score?.away;
      const currAway =
        event.scoreAway !== undefined ? event.scoreAway : event.score?.away;

      if (prev && isLive) {
        // Détection d'un changement de score à domicile
        if (currHome !== undefined && prevHome !== undefined && currHome !== prevHome) {
          const msg = `⚽ BUT (Domicile) ! ${event.homeTeam} ${currHome} - ${currAway ?? 0} ${event.awayTeam}`;
          liveAlerts.push(msg);
          goalDetails.push({
            eventId: event.id,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            side: 'home',
            scoreHome: currHome,
            scoreAway: currAway ?? 0,
            message: msg,
          });
        }
        // Détection d'un changement de score à l'extérieur
        else if (currAway !== undefined && prevAway !== undefined && currAway !== prevAway) {
          const msg = `⚽ BUT (Extérieur) ! ${event.homeTeam} ${currHome ?? 0} - ${currAway} ${event.awayTeam}`;
          liveAlerts.push(msg);
          goalDetails.push({
            eventId: event.id,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam,
            side: 'away',
            scoreHome: currHome ?? 0,
            scoreAway: currAway,
            message: msg,
          });
        }
      }

      // 1. Pour chaque match LIVE : Appeler MarketRegistry.generateMarketsForEvent(event)
      if (isLive) {
        try {
          const generatedMarkets = MarketRegistry.generateMarketsForEvent(event);

          // 2. Appliquer automatiquement l'auto-élagage
          const activeMarkets = this.autoPruneMarkets(generatedMarkets, event);

          // 3. Gestion des risques (RiskManager) : suspension temporaire et marge dynamique
          const riskManagedMarkets = riskManager.applyRiskManagement(activeMarkets, event);
          const riskMetrics = riskManager.evaluateRisk(event);
          (event as any).riskMetrics = riskMetrics;

          // Conserver également d'éventuels marchés clés du flux d'origine non présents dans les marchés générés
          if (event.markets && event.markets.length > 0) {
            const existingIds = new Set(riskManagedMarkets.map(m => m.id));
            const existingTypes = new Set(riskManagedMarkets.map(m => m.type));
            for (const origMarket of event.markets) {
              if (
                !existingIds.has(origMarket.id) &&
                !existingTypes.has(origMarket.type) &&
                !origMarket.isSuspended
              ) {
                riskManagedMarkets.push(origMarket);
              }
            }
          }

          // Mettre à jour la liste des marchés actifs du match (event.markets)
          event.markets = riskManagedMarkets;
          event.lastOddsUpdate = new Date().toISOString();
        } catch (err) {
          console.error(`[FlashBrainLiveWatcher] Erreur génération marchés pour ${event.id}:`, err);
        }
      }

      // Mémoriser l'état actuel pour la prochaine comparaison
      this.previousEvents.set(event.id, { ...event });
      return event;
    });

    // 3. Diffuser immédiatement ces marchés actualisés si un callback de broadcast est configuré
    if (this.broadcastCallback) {
      try {
        this.broadcastCallback(processedEvents, liveAlerts, goalDetails);
      } catch (err) {
        console.error('[FlashBrainLiveWatcher] Erreur lors de la diffusion broadcastSSE:', err);
      }
    }

    return { updatedEvents: processedEvents, liveAlerts, goalDetails };
  }

  /**
   * Auto-élagage en direct :
   * - Filtre les intervalles de temps dépassés (intervalles 10 min expirés)
   * - Filtre les scores exacts impossibles compte tenu du score actuel
   * - Filtre les marchés de 1re mi-temps (MT1) expirés
   * - Élimine les marchés sans sélections actives
   */
  public autoPruneMarkets(markets: Market[], event: SportEvent): Market[] {
    const scoreHome = event.scoreHome ?? event.score?.home ?? 0;
    const scoreAway = event.scoreAway ?? event.score?.away ?? 0;
    const totalScore = scoreHome + scoreAway;
    const elapsedMinutes = this.extractElapsedMinutes(event);
    const isFinished = event.status === 'finished';

    const isHalfTime =
      Boolean(event.isHalfTime) ||
      (event.period || '').toLowerCase().includes('mi-temps') ||
      (elapsedMinutes >= 45 && elapsedMinutes < 48);
    const isSecondHalf =
      elapsedMinutes > 45 ||
      (event.period || '').toLowerCase().includes('2e') ||
      (event.period || '').toLowerCase().includes('2nd');

    const activeMarkets: Market[] = [];

    for (const market of markets) {
      // A. Élagage des intervalles de temps dépassés (fb-interval-0-10, 11-20, etc.)
      const isInterval =
        market.type === 'intervals' ||
        market.id.includes('interval') ||
        market.name.toLowerCase().includes('intervalle') ||
        market.name.toLowerCase().includes('tranche');

      if (isInterval) {
        const rangeMatch =
          market.id.match(/interval-(\d+)-(\d+)/i) ||
          market.name.match(/(\d+)[e\s]*-[e\s]*(\d+)/i);

        if (rangeMatch) {
          const endMinute = parseInt(rangeMatch[2], 10);
          if (elapsedMinutes > endMinute || isFinished) {
            // Intervalle temporel dépassé : marché auto-élagué
            continue;
          }
        } else if (market.isSuspended) {
          // Marché d'intervalle suspendu/expiré
          continue;
        }
      }

      // B. Élagage des marchés 1re Mi-Temps (MT1) dépassés
      const isMt1Market =
        (market.type === 'half_time' ||
          market.id.includes('-mt1-') ||
          market.name.toLowerCase().includes('1re mi-temps') ||
          market.name.toLowerCase().includes('1st half')) &&
        !market.name.toLowerCase().includes('2e mi-temps') &&
        !market.name.toLowerCase().includes('2nd half');

      if (isMt1Market) {
        if (isSecondHalf || isHalfTime || elapsedMinutes >= 45 || isFinished) {
          // La 1re mi-temps est terminée : marché expiré
          continue;
        }
      }

      // C. Élagage des scores exacts invalides (Scores Exacts Dynamiques)
      const isExactScoreMarket =
        market.type === 'exact_score' ||
        market.id.includes('exact-score') ||
        market.name.toLowerCase().includes('score exact');

      if (isExactScoreMarket) {
        if (isFinished) {
          continue;
        }

        // Filtrer les sélections de score devenues mathématiquement impossibles
        const validSelections = market.selections.filter(sel => {
          if (
            sel.id === 'sel-exact-other' ||
            sel.name.toLowerCase().includes('autre')
          ) {
            return true;
          }

          // Détecter les scores cibles sous forme "H - A" ou "H:A"
          const scoreMatch = sel.name.match(/(\d+)\s*[-:]\s*(\d+)/);
          if (scoreMatch) {
            const targetH = parseInt(scoreMatch[1], 10);
            const targetA = parseInt(scoreMatch[2], 10);
            // Si le score actuel en direct dépasse déjà le score cible, la sélection est caduque
            if (scoreHome > targetH || scoreAway > targetA) {
              return false; // Auto-élagué
            }
          }

          return !sel.isSuspended;
        });

        // S'il ne reste aucune sélection jouable, éliminer le marché
        if (validSelections.length === 0) {
          continue;
        }

        // Conserver le marché avec uniquement les sélections mathématiquement valides
        activeMarkets.push({
          ...market,
          selections: validSelections,
        });
        continue;
      }

      // D. Élagage des marchés "Moins de" dont le seuil est déjà franchi et qui sont clôturés
      const hasImpossibleUnder = market.selections.some(s => {
        const thresholdMatch = market.name.match(/(\d+\.?\d*)/);
        if (thresholdMatch && s.name.toLowerCase().includes('moins')) {
          const threshold = parseFloat(thresholdMatch[1]);
          return totalScore > threshold;
        }
        return false;
      });

      if (hasImpossibleUnder && market.isSuspended) {
        continue;
      }

      // E. Élagage général des marchés entièrement suspendus
      if (market.isSuspended && market.selections.every(s => s.isSuspended)) {
        continue;
      }

      // Conserver les sélections actives si le marché est ouvert
      const playableSelections = market.selections.filter(s => !s.isSuspended);
      if (playableSelections.length === 0 && market.isSuspended) {
        continue;
      }

      activeMarkets.push(market);
    }

    return activeMarkets;
  }

  /**
   * Extrait les minutes écoulées du match pour l'évaluation temporelle
   */
  private extractElapsedMinutes(event: SportEvent): number {
    if (typeof (event as any).elapsedMinutes === 'number') {
      return (event as any).elapsedMinutes;
    }
    const minuteStr = event.minute || event.elapsedTime || '';
    const match = minuteStr.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 25; // estimation médiane par défaut
  }
}

export const flashBrainLiveWatcher = new FlashBrainLiveWatcher();
