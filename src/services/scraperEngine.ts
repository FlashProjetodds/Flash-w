import { liveScoreDiscovery } from './oddsAm/liveScoreDiscovery';
import { matchDetailsManager } from './oddsAm/matchDetails';
import { oddsParser } from './oddsAm/oddsParser';
import { oddsAmValidator } from './oddsAm/oddsAmValidator';
import { dataNormalizer } from './dataNormalizer';
import { SportEvent } from '../types/index';
import { OddsAmDiscoveredEvent } from '../types/oddsAm';
import { DiscoveredSport } from '../types/sports';

export interface ScraperSyncResult {
  success: boolean;
  events: SportEvent[];
  sports: DiscoveredSport[];
  count: number;
  error?: string;
  durationMs: number;
}

export class ScraperEngine {
  private static instance: ScraperEngine;
  private isRunning: boolean = false;
  private lastRunTime: string | null = null;
  private lastError: string | null = null;
  private logs: Array<{ timestamp: string; level: string; message: string }> = [];

  private constructor() {}

  public static getInstance(): ScraperEngine {
    if (!ScraperEngine.instance) {
      ScraperEngine.instance = new ScraperEngine();
    }
    return ScraperEngine.instance;
  }

  public log(level: 'info' | 'warn' | 'error' | 'success', message: string): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 200) {
      this.logs.pop();
    }
    console.log(`[ScraperEngine] ${message}`);
  }

  public getLogs(): Array<{ timestamp: string; level: string; message: string }> {
    return this.logs;
  }

  /**
   * Exécute un cycle complet de scraping multi-sports et multi-matchs réels
   */
  public async executeCycle(): Promise<ScraperSyncResult> {
    if (this.isRunning) {
      return {
        success: true,
        events: [],
        sports: [],
        count: 0,
        durationMs: 0,
      };
    }

    const start = Date.now();
    this.isRunning = true;
    this.log('info', 'Démarrage du cycle de scraping multi-sports...');

    try {
      // 1. Découverte des sports et des matchs réels
      const { matches: rawMatches, sports } = await liveScoreDiscovery.discoverAllMatches();

      this.log('info', `Sports découverts (${sports.length}) : ${sports.map(s => s.name).join(', ')}`);
      this.log('info', `Événements réels détectés : ${rawMatches.length}`);

      if (rawMatches.length === 0) {
        this.lastError = 'Aucun événement retourné par la source.';
        this.log('warn', this.lastError);
        this.isRunning = false;
        return {
          success: true,
          events: [],
          sports,
          count: 0,
          durationMs: Date.now() - start,
          error: this.lastError,
        };
      }

      // 2. Traitement des événements par lots contrôlés
      const validEvents: SportEvent[] = [];
      const BATCH_SIZE = 5;

      for (let i = 0; i < rawMatches.length; i += BATCH_SIZE) {
        const batch = rawMatches.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (raw: OddsAmDiscoveredEvent) => {
            try {
              if (!oddsAmValidator.isValidDiscoveredEvent(raw)) {
                return;
              }

              // Récupérer les cotes et marchés réels
              const { markets } = await oddsParser.fetchAllMatchMarkets(raw.matchId, raw.isLive);

              // Construire le SportEvent
              const sportEvent = matchDetailsManager.buildSportEvent(raw, markets);

              if (oddsAmValidator.validateSportEvent(sportEvent)) {
                validEvents.push(sportEvent);
              }
            } catch (err: any) {
              this.log('warn', `Erreur sur le match ${raw.matchId} : ${err.message}`);
            }
          })
        );
      }

      const durationMs = Date.now() - start;
      this.lastRunTime = new Date().toISOString();
      this.lastError = null;
      this.isRunning = false;

      this.log('success', `Cycle achevé avec succès en ${durationMs}ms : ${validEvents.length} événements valides.`);

      return {
        success: true,
        events: validEvents,
        sports,
        count: validEvents.length,
        durationMs,
      };
    } catch (err: any) {
      this.lastError = `Erreur globale du scraper : ${err.message}`;
      this.log('error', this.lastError);
      this.isRunning = false;

      return {
        success: false,
        events: [],
        sports: [],
        count: 0,
        durationMs: Date.now() - start,
        error: this.lastError,
      };
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      lastError: this.lastError,
    };
  }
}

export const scraperEngine = ScraperEngine.getInstance();
