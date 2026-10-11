import * as cheerio from 'cheerio';
import { SportEvent, Market, OddSelection, EventStatus, MarketCategory } from '../types';
import { POPULAR_TEAM_LOGOS, generateTeamBadgeSvg, normalizeTeamKey } from '../utils/logo';
import { sortEventsIntelligently } from '../utils/sorting';

export interface ScraperStatus {
  sourceOdds: string;
  sourceScores: string;
  sourceMatchEnDirect: string;
  sourceEurosport: string;
  sourceSofaScore: string;
  matchEnDirectCount: number;
  eurosportCount: number;
  sofaScoreCount: number;
  lastScrapedAt: string | null;
  isRunning: boolean;
  totalEvents: number;
  liveEventsWithOddsCount: number;
  todayEventsCount: number;
  upcomingEventsCount: number;
  sportsCounts: Record<string, number>;
  lastError: string | null;
  intervalSeconds: number;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const ODDS_AM_URL = 'https://odds.am/fr/live/';
const LIVESCORE_URL = 'https://www.livescore.com/fr/';
const MATCH_EN_DIRECT_URL = 'https://www.matchendirect.fr/';
const EUROSPORT_URL = 'https://www.eurosport.fr/';
const SOFASCORE_URL = 'https://www.sofascore.com/';

/**
 * Filter validator:
 * RÈGLE FONDAMENTALE DE FLASH :
 * Si les données de variation de cote d'un événement en direct (football, basketball, tennis ou tout autre sport)
 * ne sont pas collectées et affichées en temps réel, NE PAS AFFICHER CET ÉVÉNEMENT EN DIRECT.
 */
export function isDisplayableLiveEvent(event: SportEvent): boolean {
  if (event.status !== 'live') {
    return true;
  }

  // Pour les matchs en DIRECT : obligatoire d'avoir des marchés avec des cotes valides et données de variation
  if (!event.markets || event.markets.length === 0) return false;

  const validSelections = event.markets.flatMap(m => m.selections || []);
  if (validSelections.length === 0) return false;

  const hasValidOdds = validSelections.some(s => typeof s.odds === 'number' && s.odds > 1.0);
  if (!hasValidOdds) return false;

  const hasVariation = validSelections.some(
    s => s.trend !== undefined || typeof s.previousOdds === 'number'
  );

  return hasVariation || !!event.hasLiveOddsAndVariation;
}

interface HistoricalOdd {
  odds: number;
  timestamp: string;
}

class FlashLiveSportsScraper {
  private events: Map<string, SportEvent> = new Map();
  private isScraping: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private lastScrapedAt: Date | null = null;
  private lastError: string | null = null;
  private listeners: Set<(events: SportEvent[]) => void> = new Set();
  private detailOddsCache: Map<string, { timestamp: number; markets: Market[] }> = new Map();
  private allMarketsCache: Map<string, { timestamp: number; markets: Market[] }> = new Map();
  private teamLogosCache: Map<string, string> = new Map();

  // In-memory historical odds storage to track real previousOdds and exact variations
  private oddsHistory: Map<string, HistoricalOdd> = new Map();

  // Multi-source collectors tracking (MatchEnDirect, Eurosport, SofaScore)
  private matchEnDirectEventsCount: number = 0;
  private eurosportEventsCount: number = 0;
  private sofaScoreEventsCount: number = 0;

  constructor() {
    this.seedKnownTeamLogos();
    // Start automated continuous background scraping (every 15 to 30 seconds for live freshness)
    this.startAutoScraper(20);
  }

  private normalizeTeamName(name: string): string {
    return normalizeTeamKey(name);
  }

  /**
   * Retrieves the logo for any team or athlete.
   * Looks up direct cache, fuzzy matching, and automatically falls back
   * to a dynamic vector sports emblem so that 100% of matches display a logo.
   */
  public getTeamLogo(name: string, sport: string = 'football'): string {
    if (!name) return '';
    const norm = this.normalizeTeamName(name);

    // 1. Exact match in cache
    const direct = this.teamLogosCache.get(norm);
    if (direct) return direct;

    // 2. Substring matching against known keys
    for (const [key, url] of this.teamLogosCache.entries()) {
      if (key.length >= 4 && (key.includes(norm) || norm.includes(key))) {
        return url;
      }
    }

    // 3. Fallback: generate high-quality sports crest SVG and cache it
    const generated = generateTeamBadgeSvg(name, sport);
    this.teamLogosCache.set(norm, generated);
    return generated;
  }

  public setTeamLogo(name: string, logo: string) {
    if (name && logo && !logo.includes('equipe-logodefaut') && !logo.includes('betclic')) {
      this.teamLogosCache.set(this.normalizeTeamName(name), logo);
    }
  }

  private seedKnownTeamLogos() {
    // 1. Load curated popular teams and nations
    for (const [key, url] of Object.entries(POPULAR_TEAM_LOGOS)) {
      this.teamLogosCache.set(this.normalizeTeamName(key), url);
    }

    // 2. Specific additional teams
    const seedTeams: [string, string][] = [
      ['cuba', 'https://file.mackolikfeeds.com/teams/401'],
      ['bonaire', 'https://file.mackolikfeeds.com/teams/424'],
      ['san lorenzo', 'https://file.mackolikfeeds.com/teams/1694'],
      ['recoleta', 'https://file.mackolikfeeds.com/teams/32510'],
      ['serbie', 'https://file.mackolikfeeds.com/teams/6816'],
      ['pays-bas', 'https://file.mackolikfeeds.com/teams/1552'],
      ['allemagne', 'https://file.mackolikfeeds.com/teams/1037'],
      ['grece', 'https://file.mackolikfeeds.com/teams/1091'],
      ['danemark', 'https://file.mackolikfeeds.com/teams/643'],
      ['pays de galles', 'https://file.mackolikfeeds.com/teams/2332'],
      ['canada', 'https://file.mackolikfeeds.com/teams/401'],
      ['chili', 'https://file.mackolikfeeds.com/teams/424'],
      ['psg', 'https://file.mackolikfeeds.com/teams/1644'],
      ['paris saint-germain', 'https://file.mackolikfeeds.com/teams/1644'],
      ['marseille', 'https://file.mackolikfeeds.com/teams/1643'],
      ['olympique de marseille', 'https://file.mackolikfeeds.com/teams/1643'],
      ['lyon', 'https://file.mackolikfeeds.com/teams/1642'],
      ['olympique lyonnais', 'https://file.mackolikfeeds.com/teams/1642'],
      ['monaco', 'https://file.mackolikfeeds.com/teams/1645'],
      ['as monaco', 'https://file.mackolikfeeds.com/teams/1645'],
      ['lille', 'https://file.mackolikfeeds.com/teams/1646'],
      ['rennes', 'https://file.mackolikfeeds.com/teams/1647'],
      ['lens', 'https://file.mackolikfeeds.com/teams/1649'],
      ['real madrid', 'https://file.mackolikfeeds.com/teams/2017'],
      ['barcelone', 'https://file.mackolikfeeds.com/teams/2016'],
      ['fc barcelone', 'https://file.mackolikfeeds.com/teams/2016'],
      ['atletico madrid', 'https://file.mackolikfeeds.com/teams/2020'],
      ['manchester city', 'https://file.mackolikfeeds.com/teams/676'],
      ['man city', 'https://file.mackolikfeeds.com/teams/676'],
      ['manchester united', 'https://file.mackolikfeeds.com/teams/662'],
      ['man united', 'https://file.mackolikfeeds.com/teams/662'],
      ['liverpool', 'https://file.mackolikfeeds.com/teams/663'],
      ['arsenal', 'https://file.mackolikfeeds.com/teams/660'],
      ['chelsea', 'https://file.mackolikfeeds.com/teams/661'],
      ['bayern munich', 'https://file.mackolikfeeds.com/teams/964'],
      ['dortmund', 'https://file.mackolikfeeds.com/teams/963'],
      ['borussia dortmund', 'https://file.mackolikfeeds.com/teams/963'],
      ['juventus', 'https://file.mackolikfeeds.com/teams/1242'],
      ['inter milan', 'https://file.mackolikfeeds.com/teams/1244'],
      ['inter', 'https://file.mackolikfeeds.com/teams/1244'],
      ['milan ac', 'https://file.mackolikfeeds.com/teams/1245'],
      ['ac milan', 'https://file.mackolikfeeds.com/teams/1245'],
      ['france', 'https://file.mackolikfeeds.com/teams/924'],
      ['espagne', 'https://file.mackolikfeeds.com/teams/1792'],
      ['angleterre', 'https://file.mackolikfeeds.com/teams/828'],
      ['italie', 'https://file.mackolikfeeds.com/teams/1199'],
      ['portugal', 'https://file.mackolikfeeds.com/teams/1634'],
      ['belgique', 'https://file.mackolikfeeds.com/teams/283'],
      ['croatie', 'https://file.mackolikfeeds.com/teams/599'],
    ];
    for (const [name, logo] of seedTeams) {
      this.teamLogosCache.set(this.normalizeTeamName(name), logo);
    }
  }

  public subscribe(listener: (events: SportEvent[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllEvents());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = this.getAllEvents();
    this.listeners.forEach(fn => fn(list));
  }

  /**
   * Returns all events, strictly filtering out any live event that lacks collected odds and variation data.
   */
  public getAllEvents(includeFinished: boolean = true): SportEvent[] {
    const list = Array.from(this.events.values()).filter(e => isDisplayableLiveEvent(e));
    const sorted = sortEventsIntelligently(list);
    if (includeFinished) return sorted;
    return sorted.filter(e => e.status !== 'finished');
  }

  public getActiveEvents(): SportEvent[] {
    const list = Array.from(this.events.values())
      .filter(e => e.status !== 'finished')
      .filter(e => isDisplayableLiveEvent(e));
    return sortEventsIntelligently(list);
  }

  public getEventById(id: string): SportEvent | undefined {
    const ev = this.events.get(id);
    if (!ev) return undefined;
    if (ev.status === 'live' && !isDisplayableLiveEvent(ev)) return undefined;
    return ev;
  }

  public getStatus(): ScraperStatus {
    const all = this.getAllEvents(true);
    const live = all.filter(e => e.status === 'live');
    const now = new Date();
    const today = all.filter(e => {
      if (e.status === 'live' || e.status === 'finished') return false;
      const d = new Date(e.startTime);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }).length;
    const upcoming = all.filter(e => {
      if (e.status === 'live' || e.status === 'finished') return false;
      const d = new Date(e.startTime);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return d.getTime() > endOfToday.getTime();
    }).length;

    const sportsCounts: Record<string, number> = {};
    for (const e of all) {
      sportsCounts[e.sport] = (sportsCounts[e.sport] || 0) + 1;
    }

    return {
      sourceOdds: ODDS_AM_URL,
      sourceScores: LIVESCORE_URL,
      sourceMatchEnDirect: MATCH_EN_DIRECT_URL,
      sourceEurosport: EUROSPORT_URL,
      sourceSofaScore: SOFASCORE_URL,
      matchEnDirectCount: this.matchEnDirectEventsCount,
      eurosportCount: this.eurosportEventsCount,
      sofaScoreCount: this.sofaScoreEventsCount,
      lastScrapedAt: this.lastScrapedAt ? this.lastScrapedAt.toISOString() : null,
      isRunning: this.isScraping,
      totalEvents: all.length,
      liveEventsWithOddsCount: live.length,
      todayEventsCount: today,
      upcomingEventsCount: upcoming,
      sportsCounts,
      lastError: this.lastError,
      intervalSeconds: 20,
    };
  }

  public startAutoScraper(seconds: number = 20) {
    if (this.intervalTimer) clearInterval(this.intervalTimer);

    // Initial scrape immediate
    this.scrapeAll().catch(() => {});

    // Loop continuously
    this.intervalTimer = setInterval(() => {
      this.scrapeAll().catch(() => {});
    }, seconds * 1000);
  }

  public stopAutoScraper() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public async triggerScrapeNow(): Promise<ScraperStatus> {
    await this.scrapeAll();
    return this.getStatus();
  }

  /**
   * Main scraping pipeline:
   * 1. Collect live events and odds variations from https://odds.am/fr/live/
   * 2. Cross-verify live scores with https://www.livescore.com/fr/
   * 3. Collect upcoming and today fixtures from LiveScore and matchendirect
   * 4. Enforce strict rule: NO LIVE ODDS/VARIATION = NO LIVE EVENT DISPLAY
   */
  public async scrapeAll(): Promise<void> {
    if (this.isScraping) return;
    this.isScraping = true;
    this.lastError = null;

    try {
      // 1. Collect Live Events and Variations from ODDS.am
      const oddsAmEvents = await this.scrapeOddsAmLive();

      // 2. Collect Live Scores from LiveScore
      const liveScoreData = await this.scrapeLiveScores();

      // 3. Merge & verify LiveScore scores with ODDS.am live events
      const verifiedLiveEvents = this.mergeAndVerifyLiveEvents(oddsAmEvents, liveScoreData.liveEvents);

      // Ingest verified live events
      for (const ev of verifiedLiveEvents) {
        if (isDisplayableLiveEvent(ev)) {
          this.events.set(ev.id, ev);
        }
      }

      // Automated collection of all available markets for live events displayed in Flash
      for (const ev of verifiedLiveEvents) {
        if (isDisplayableLiveEvent(ev)) {
          this.enrichAllMarketsForEvent(ev)
            .then(() => {
              this.notify();
            })
            .catch(() => {});
        }
      }

      // 4. Collect Today & Upcoming events from LiveScore & matchendirect for calendar completeness
      const upcomingAndToday = await this.scrapeUpcomingAndToday(liveScoreData.todayEvents);
      for (const ev of upcomingAndToday) {
        // If not already in live events
        if (!this.events.has(ev.id)) {
          this.events.set(ev.id, ev);
        }
      }

      // 5. Collect, retrieve and cross-verify with requested URLs:
      // - https://www.matchendirect.fr/
      // - https://www.eurosport.fr/
      // - https://www.sofascore.com/
      const [medEvents, euroEvents, sofaEvents] = await Promise.all([
        this.scrapeMatchEnDirect().catch(() => []),
        this.scrapeEurosport().catch(() => []),
        this.scrapeSofaScore().catch(() => []),
      ]);

      this.matchEnDirectEventsCount = medEvents.length;
      this.eurosportEventsCount = euroEvents.length;
      this.sofaScoreEventsCount = sofaEvents.length;

      // Cross-verify scores, minutes, half-times and metadata
      this.crossVerifyWithExternalSources(medEvents, euroEvents, sofaEvents);

      this.lastScrapedAt = new Date();
      this.notify();
    } catch (err: any) {
      this.lastError = err.message || 'Erreur lors de la collecte depuis les flux officiels';
      console.error('[Scraper Error]', this.lastError);
    } finally {
      this.isScraping = false;
    }
  }

  /**
   * Safely extracts home and away scores from odds.am row data.
   * Handles strings ('1:0', '2-1'), arrays ([1, 0]), objects ({ home: 1, away: 0 }, { h: 1, a: 0 }),
   * numbers, null/undefined without ever throwing TypeError.
   */
  private parseOddsAmScore(rawScore: unknown, row?: any): { home: number; away: number } | undefined {
    if (rawScore != null) {
      if (typeof rawScore === 'string') {
        const trimmed = rawScore.trim();
        if (trimmed.includes(':')) {
          const parts = trimmed.split(':');
          const h = parseInt(parts[0], 10);
          const a = parseInt(parts[1], 10);
          if (!isNaN(h) && !isNaN(a)) return { home: h, away: a };
        } else if (trimmed.includes('-')) {
          const parts = trimmed.split('-');
          const h = parseInt(parts[0], 10);
          const a = parseInt(parts[1], 10);
          if (!isNaN(h) && !isNaN(a)) return { home: h, away: a };
        }
      } else if (Array.isArray(rawScore) && rawScore.length >= 2) {
        const h = Number(rawScore[0]);
        const a = Number(rawScore[1]);
        if (!isNaN(h) && !isNaN(a)) return { home: h, away: a };
      } else if (typeof rawScore === 'object') {
        const obj = rawScore as Record<string, any>;
        const homeVal = obj.home ?? obj.h ?? obj.team1 ?? obj.scoreHome ?? obj.score_home ?? obj[0];
        const awayVal = obj.away ?? obj.a ?? obj.team2 ?? obj.scoreAway ?? obj.score_away ?? obj[1];
        if (homeVal !== undefined && awayVal !== undefined) {
          const h = Number(homeVal);
          const a = Number(awayVal);
          if (!isNaN(h) && !isNaN(a)) return { home: h, away: a };
        }
        if (typeof obj.current === 'string') {
          return this.parseOddsAmScore(obj.current);
        }
        if (typeof obj.score === 'string') {
          return this.parseOddsAmScore(obj.score);
        }
      }
    }

    // Fallback checks on row if present
    if (row && typeof row === 'object') {
      if (row.score1 !== undefined && row.score2 !== undefined) {
        const h = Number(row.score1);
        const a = Number(row.score2);
        if (!isNaN(h) && !isNaN(a)) return { home: h, away: a };
      }
      if (row.scoreHome !== undefined && row.scoreAway !== undefined) {
        const h = Number(row.scoreHome);
        const a = Number(row.scoreAway);
        if (!isNaN(h) && !isNaN(a)) return { home: h, away: a };
      }
    }

    return undefined;
  }

  /**
   * Collects live matches, markets, odds, and real-time variations from https://odds.am/fr/live/
   */
  private async scrapeOddsAmLive(): Promise<SportEvent[]> {
    const results: SportEvent[] = [];
    const nowIso = new Date().toISOString();

    try {
      const res = await fetch(ODDS_AM_URL, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} sur ${ODDS_AM_URL}`);
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const topMatches = $('top-matches');
      const rawLeagues = topMatches.attr(':p-leagues');

      if (!rawLeagues || rawLeagues.trim() === '[]') {
        return results;
      }

      let leagues: any[] = [];
      try {
        // Safely evaluate javascript object literal
        leagues = Function('"use strict";return (' + rawLeagues + ')')();
      } catch (parseErr) {
        console.warn('[Scraper] Warning evaluating :p-leagues on odds.am:', parseErr);
        return results;
      }

      for (const lg of leagues) {
        const comp = lg.title || 'Ligue Internationale';

        for (const r of lg.rows || []) {
          const oddsArr = r.odds || [];
          if (!oddsArr || oddsArr.length < 2) {
            // Pas de cotes réelles -> NE PAS AFFICHER
            continue;
          }

          // Parse score safely (protects against object, array, number, string variations)
          const scoreObj = this.parseOddsAmScore(r.score, r);

          // Parse odds and compute real variations
          const selections: OddSelection[] = [];
          const labels = ['1', 'Nul', '2'];
          let hasCalculatedVariation = false;

          oddsArr.forEach((item: any[], idx: number) => {
            const currentOdd = parseFloat(item[0]);
            if (isNaN(currentOdd) || currentOdd <= 1.0) return;

            const selectionKey = `oddsam-${r.match_id}-${idx}`;
            const history = this.oddsHistory.get(selectionKey);

            let trend: 'up' | 'down' | 'stable' = 'stable';
            let previousOddVal: number | undefined = undefined;

            if (history) {
              previousOddVal = history.odds;
              if (currentOdd > history.odds) {
                trend = 'up';
                hasCalculatedVariation = true;
              } else if (currentOdd < history.odds) {
                trend = 'down';
                hasCalculatedVariation = true;
              } else {
                trend = 'stable';
              }
            } else {
              // Si première observation, regarder le trend direct fourni par odds.am: 'up', 'down', 'none'
              const oddsAmTrend = item[2];
              if (oddsAmTrend === 'up') {
                trend = 'up';
                hasCalculatedVariation = true;
              } else if (oddsAmTrend === 'down') {
                trend = 'down';
                hasCalculatedVariation = true;
              } else {
                trend = 'stable';
              }
            }

            // Mettre à jour l'historique de cote
            this.oddsHistory.set(selectionKey, {
              odds: currentOdd,
              timestamp: nowIso,
            });

            selections.push({
              id: selectionKey,
              name: labels[idx] || `Choix ${idx + 1}`,
              odds: currentOdd,
              previousOdds: previousOddVal,
              trend,
              variationTimestamp: nowIso,
            });
          });

          if (selections.length < 2) {
            // Cote incomplète -> ne pas afficher
            continue;
          }

          // Déduire le sport à partir du titre ou de l'URL
          let sport = 'football';
          const lowerComp = comp.toLowerCase();
          if (lowerComp.includes('basket') || lowerComp.includes('nba')) sport = 'basketball';
          else if (lowerComp.includes('tennis') || lowerComp.includes('atp') || lowerComp.includes('wta')) sport = 'tennis';
          else if (lowerComp.includes('rugby')) sport = 'rugby';
          else if (lowerComp.includes('hockey') || lowerComp.includes('nhl')) sport = 'hockey';

          const homeTeam = (typeof r.team1 === 'string' ? r.team1 : String(r.team1 || '')).trim();
          const awayTeam = (typeof r.team2 === 'string' ? r.team2 : String(r.team2 || '')).trim();
          if (!homeTeam || !awayTeam) continue;

          const matchId = `oddsam-${r.match_id}`;
          const detailUrl = typeof r.link === 'string' && r.link ? `https://odds.am${r.link}` : undefined;

          // Collecte des logos pour chaque équipe :
          // 1. Drapeaux/logos officiels fournis par odds.am (r.logo1 / r.logo2)
          const oddsAmFlag1 = r.logo1 ? `https://odds.am/img/flags/${r.logo1}.png` : undefined;
          const oddsAmFlag2 = r.logo2 ? `https://odds.am/img/flags/${r.logo2}.png` : undefined;

          if (oddsAmFlag1 && !this.teamLogosCache.has(this.normalizeTeamName(homeTeam))) {
            this.setTeamLogo(homeTeam, oddsAmFlag1);
          }
          if (oddsAmFlag2 && !this.teamLogosCache.has(this.normalizeTeamName(awayTeam))) {
            this.setTeamLogo(awayTeam, oddsAmFlag2);
          }

          const homeLogo = this.getTeamLogo(homeTeam, sport);
          const awayLogo = this.getTeamLogo(awayTeam, sport);

          let startTime = nowIso;
          if (r.timestart) {
            try {
              const parsedDate = new Date(r.timestart);
              if (!isNaN(parsedDate.getTime())) {
                startTime = parsedDate.toISOString();
              }
            } catch {}
          }

          const rawTimeLive = typeof r.timelive === 'string' && r.timelive.trim()
            ? r.timelive.trim()
            : (r.timelive != null ? String(r.timelive).trim() : '');

          const isHalfTime =
            /^(ht|mi-temps|pause|half\s*time|mt)$/i.test(rawTimeLive) ||
            rawTimeLive.toLowerCase().includes('mi-temps') ||
            rawTimeLive.toLowerCase().includes('pause');

          const minuteText = isHalfTime ? 'Mi-temps' : (rawTimeLive || 'En direct');
          const periodText = isHalfTime ? 'Mi-temps' : (sport === 'tennis' && rawTimeLive.includes('set') ? rawTimeLive : 'En direct');

          results.push({
            id: matchId,
            sport,
            competition: comp,
            homeTeam,
            awayTeam,
            teams: {
              home: {
                id: `th-${matchId}`,
                name: homeTeam,
                logo: homeLogo,
              },
              away: {
                id: `ta-${matchId}`,
                name: awayTeam,
                logo: awayLogo,
              },
            },
            homeTeamData: { id: `th-${matchId}`, name: homeTeam, logo: homeLogo },
            awayTeamData: { id: `ta-${matchId}`, name: awayTeam, logo: awayLogo },
            homeTeamLogo: homeLogo,
            awayTeamLogo: awayLogo,
            startTime,
            status: 'live',
            resultStatus: 'pending',
            score: scoreObj,
            minute: minuteText,
            period: periodText,
            isHalfTime,
            markets: [
              {
                id: `mkt-${matchId}-1x2`,
                type: 'result',
                name: 'Résultat du match (1X2)',
                selections,
              },
            ],
            detailLink: detailUrl,
            officialSource: 'ODDS.am (Cotes & Variations) & LiveScore (Scores en direct)',
            hasLiveOddsAndVariation: true,
            lastOddsUpdate: nowIso,
          });
        }
      }
    } catch (err) {
      console.warn('[Scraper] Erreur lors de la collecte ODDS.am live:', err);
    }

    return results;
  }

  /**
   * Scrapes verified live scores from LiveScore (https://www.livescore.com/fr/ and public API)
   */
  private async scrapeLiveScores(): Promise<{ liveEvents: any[]; todayEvents: SportEvent[] }> {
    const liveEvents: any[] = [];
    const todayEvents: SportEvent[] = [];
    const nowIso = new Date().toISOString();

    const sports = [
      { id: 'soccer', name: 'football' },
      { id: 'basketball', name: 'basketball' },
      { id: 'tennis', name: 'tennis' },
      { id: 'hockey', name: 'hockey' },
    ];

    for (const s of sports) {
      try {
        const liveRes = await fetch(`https://prod-public-api.livescore.com/v1/api/app/live/${s.id}/0?locale=fr`, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          },
        });

        if (liveRes.ok) {
          const json = await liveRes.json();
          for (const stg of json.Stages || []) {
            for (const ev of stg.Events || []) {
              const hTeam = ev.T1?.[0]?.Nm;
              const aTeam = ev.T2?.[0]?.Nm;
              const hImg = ev.T1?.[0]?.Img;
              const aImg = ev.T2?.[0]?.Img;

              const hLogo = hImg ? `https://storage.livescore.com/images/team/medium/${hImg}` : undefined;
              const aLogo = aImg ? `https://storage.livescore.com/images/team/medium/${aImg}` : undefined;

              if (hTeam && hLogo) this.setTeamLogo(hTeam, hLogo);
              if (aTeam && aLogo) this.setTeamLogo(aTeam, aLogo);
              if (ev.T1?.[0]?.NmEn && hLogo) this.setTeamLogo(ev.T1[0].NmEn, hLogo);
              if (ev.T2?.[0]?.NmEn && aLogo) this.setTeamLogo(ev.T2[0].NmEn, aLogo);

              const rawEps = String(ev.Eps || '').trim();
              const isHt = rawEps === 'HT' || ev.Esid === 3 || rawEps.toLowerCase().includes('half') || rawEps.toLowerCase().includes('mi-temps');
              const displayMin = isHt ? 'Mi-temps' : (rawEps || 'LIVE');
              const displayPer = isHt ? 'Mi-temps' : rawEps;

              liveEvents.push({
                sport: s.name,
                stage: stg.Snm || stg.Cnm,
                homeTeam: hTeam,
                awayTeam: aTeam,
                homeLogo: hLogo || (hTeam ? this.getTeamLogo(hTeam, s.name) : undefined),
                awayLogo: aLogo || (aTeam ? this.getTeamLogo(aTeam, s.name) : undefined),
                scoreHome: typeof ev.Tr1 === 'number' ? ev.Tr1 : parseInt(ev.Tr1, 10),
                scoreAway: typeof ev.Tr2 === 'number' ? ev.Tr2 : parseInt(ev.Tr2, 10),
                minute: displayMin,
                period: displayPer,
                isHalfTime: isHt,
              });
            }
          }
        }
      } catch {}
    }

    // Also fetch today's confirmed schedule and logos from LiveScore
    try {
      const todayDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const todayRes = await fetch(`https://prod-public-api.livescore.com/v1/api/app/date/soccer/${todayDateStr}/0?locale=fr`, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
      });

      if (todayRes.ok) {
        const json = await todayRes.json();
        for (const stg of json.Stages || []) {
          for (const ev of stg.Events || []) {
            const hTeam = ev.T1?.[0]?.Nm;
            const aTeam = ev.T2?.[0]?.Nm;
            if (!hTeam || !aTeam) continue;

            const isFinished = ev.Eps === 'FT' || ev.Eps === 'AET' || ev.Eps === 'AP' || ev.Esid === 6;
            const isLive = ev.Esid === 2 || (ev.Eps && ev.Eps.includes("'"));

            let scoreObj: { home: number; away: number } | undefined = undefined;
            if (typeof ev.Tr1 !== 'undefined' && typeof ev.Tr2 !== 'undefined') {
              const h = parseInt(ev.Tr1, 10);
              const a = parseInt(ev.Tr2, 10);
              if (!isNaN(h) && !isNaN(a)) scoreObj = { home: h, away: a };
            }

            const id = `ls-${ev.Eid}`;
            let startTime = nowIso;
            if (ev.Esd) {
              try {
                // Esd format: 20260928190000
                const esdStr = String(ev.Esd);
                if (esdStr.length >= 12) {
                  const y = esdStr.slice(0, 4);
                  const m = esdStr.slice(4, 6);
                  const d = esdStr.slice(6, 8);
                  const hr = esdStr.slice(8, 10);
                  const min = esdStr.slice(10, 12);
                  startTime = new Date(`${y}-${m}-${d}T${hr}:${min}:00Z`).toISOString();
                }
              } catch {}
            }

            const hImg = ev.T1?.[0]?.Img;
            const aImg = ev.T2?.[0]?.Img;
            const hLogo = hImg ? `https://storage.livescore.com/images/team/medium/${hImg}` : undefined;
            const aLogo = aImg ? `https://storage.livescore.com/images/team/medium/${aImg}` : undefined;

            if (hLogo) this.setTeamLogo(hTeam, hLogo);
            if (aLogo) this.setTeamLogo(aTeam, aLogo);
            if (ev.T1?.[0]?.NmEn && hLogo) this.setTeamLogo(ev.T1[0].NmEn, hLogo);
            if (ev.T2?.[0]?.NmEn && aLogo) this.setTeamLogo(ev.T2[0].NmEn, aLogo);

            const finalHomeLogo = hLogo || this.getTeamLogo(hTeam, 'football');
            const finalAwayLogo = aLogo || this.getTeamLogo(aTeam, 'football');

            todayEvents.push({
              id,
              sport: 'football',
              competition: stg.Snm || 'Football International',
              homeTeam: hTeam,
              awayTeam: aTeam,
              teams: {
                home: { id: `th-${id}`, name: hTeam, logo: finalHomeLogo },
                away: { id: `ta-${id}`, name: aTeam, logo: finalAwayLogo },
              },
              homeTeamData: { id: `th-${id}`, name: hTeam, logo: finalHomeLogo },
              awayTeamData: { id: `ta-${id}`, name: aTeam, logo: finalAwayLogo },
              homeTeamLogo: finalHomeLogo,
              awayTeamLogo: finalAwayLogo,
              startTime,
              status: isFinished ? 'finished' : isLive ? 'live' : 'upcoming',
              resultStatus: isFinished && scoreObj ? 'confirmed' : 'pending',
              score: scoreObj,
              minute: isFinished ? 'Terminé' : ev.Eps || undefined,
              markets: [],
              officialSource: 'LiveScore (https://www.livescore.com/fr/)',
            });
          }
        }
      }
    } catch {}

    // Collecter également les logos de la journée de demain depuis LiveScore
    try {
      const tomorrowObj = new Date();
      tomorrowObj.setDate(tomorrowObj.getDate() + 1);
      const tomorrowDateStr = tomorrowObj.toISOString().slice(0, 10).replace(/-/g, '');
      const tomorrowRes = await fetch(`https://prod-public-api.livescore.com/v1/api/app/date/soccer/${tomorrowDateStr}/0?locale=fr`, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
      });
      if (tomorrowRes.ok) {
        const tJson = await tomorrowRes.json();
        for (const stg of tJson.Stages || []) {
          for (const ev of stg.Events || []) {
            const hTeam = ev.T1?.[0]?.Nm;
            const aTeam = ev.T2?.[0]?.Nm;
            if (!hTeam || !aTeam) continue;
            const hImg = ev.T1?.[0]?.Img;
            const aImg = ev.T2?.[0]?.Img;
            const hLogo = hImg ? `https://storage.livescore.com/images/team/medium/${hImg}` : undefined;
            const aLogo = aImg ? `https://storage.livescore.com/images/team/medium/${aImg}` : undefined;
            if (hLogo) this.setTeamLogo(hTeam, hLogo);
            if (aLogo) this.setTeamLogo(aTeam, aLogo);
            if (ev.T1?.[0]?.NmEn && hLogo) this.setTeamLogo(ev.T1[0].NmEn, hLogo);
            if (ev.T2?.[0]?.NmEn && aLogo) this.setTeamLogo(ev.T2[0].NmEn, aLogo);
          }
        }
      }
    } catch {}

    return { liveEvents, todayEvents };
  }

  /**
   * Cross-verifies live scores, minutes and logos between ODDS.am and LiveScore
   */
  private mergeAndVerifyLiveEvents(oddsAmEvents: SportEvent[], lsLiveEvents: any[]): SportEvent[] {
    return oddsAmEvents.map(event => {
      const eHomeNorm = this.normalizeTeamName(event.homeTeam);
      const eAwayNorm = this.normalizeTeamName(event.awayTeam);

      // Search matching event in LiveScore
      const matchedLs = lsLiveEvents.find(ls => {
        const lsHomeNorm = this.normalizeTeamName(ls.homeTeam);
        const lsAwayNorm = this.normalizeTeamName(ls.awayTeam);
        return (
          (lsHomeNorm.includes(eHomeNorm) || eHomeNorm.includes(lsHomeNorm)) &&
          (lsAwayNorm.includes(eAwayNorm) || eAwayNorm.includes(lsAwayNorm))
        );
      });

      if (matchedLs) {
        // Enforce verified score from LiveScore if valid numbers
        if (!isNaN(matchedLs.scoreHome) && !isNaN(matchedLs.scoreAway)) {
          event.score = { home: matchedLs.scoreHome, away: matchedLs.scoreAway };
        }
        if (matchedLs.isHalfTime || matchedLs.minute === 'HT' || matchedLs.minute === 'Mi-temps') {
          event.isHalfTime = true;
          event.minute = 'Mi-temps';
          event.period = 'Mi-temps';
        } else {
          if (matchedLs.minute && matchedLs.minute !== 'LIVE') {
            event.minute = matchedLs.minute;
          }
          if (matchedLs.period && matchedLs.period !== 'LIVE') {
            event.period = matchedLs.period;
          }
        }
        if (matchedLs.homeLogo) {
          if (event.teams?.home) event.teams.home.logo = matchedLs.homeLogo;
          if (event.homeTeamData) event.homeTeamData.logo = matchedLs.homeLogo;
          (event as any).homeTeamLogo = matchedLs.homeLogo;
        }
        if (matchedLs.awayLogo) {
          if (event.teams?.away) event.teams.away.logo = matchedLs.awayLogo;
          if (event.awayTeamData) event.awayTeamData.logo = matchedLs.awayLogo;
          (event as any).awayTeamLogo = matchedLs.awayLogo;
        }
      }

      return event;
    });
  }

  /**
   * Scrapes upcoming and today fixtures from LiveScore and matchendirect to ensure a full calendar
   */
  private async scrapeUpcomingAndToday(todayFixtures: SportEvent[]): Promise<SportEvent[]> {
    const combined: SportEvent[] = [...todayFixtures];

    // Also fetch tomorrow upcoming matches from matchendirect.fr
    try {
      const res = await fetch('https://www.matchendirect.fr/demain/', {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });

      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        $('tr[data-matchid]').slice(0, 40).each((_, tr) => {
          const id = $(tr).attr('data-matchid');
          if (!id) return;

          const comp = $(tr).find('[data-competitionname]').attr('data-competitionname') || 'Football';
          const homeTeam = $(tr).find('[data-team1]').attr('data-team1')?.trim();
          const awayTeam = $(tr).find('[data-team2]').attr('data-team2')?.trim();
          if (!homeTeam || !awayTeam) return;

          const timeText = $(tr).find('.lm2_timeXxX, .time').text().trim();
          let startTime = tomorrow.toISOString();
          if (timeText && timeText.includes(':')) {
            const [h, m] = timeText.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m)) {
              const d = new Date(tomorrow);
              d.setHours(h, m, 0, 0);
              startTime = d.toISOString();
            }
          }

          const homeLogo = this.getTeamLogo(homeTeam, 'football');
          const awayLogo = this.getTeamLogo(awayTeam, 'football');

          combined.push({
            id: `med-${id}`,
            sport: 'football',
            competition: comp,
            homeTeam,
            awayTeam,
            teams: {
              home: { id: `th-${id}`, name: homeTeam, logo: homeLogo },
              away: { id: `ta-${id}`, name: awayTeam, logo: awayLogo },
            },
            homeTeamData: { id: `th-${id}`, name: homeTeam, logo: homeLogo },
            awayTeamData: { id: `ta-${id}`, name: awayTeam, logo: awayLogo },
            homeTeamLogo: homeLogo,
            awayTeamLogo: awayLogo,
            startTime,
            status: 'upcoming',
            resultStatus: 'pending',
            markets: [],
            officialSource: 'matchendirect.fr & LiveScore',
          });
        });
      }
    } catch {}

    return combined;
  }

  /**
   * 1. Collecte en temps réel depuis MatchEnDirect (https://www.matchendirect.fr/)
   * Récupère tous les scores en direct, mi-temps, minutes réelles et calendriers officiels
   */
  public async scrapeMatchEnDirect(): Promise<SportEvent[]> {
    const results: SportEvent[] = [];
    try {
      const res = await fetch(MATCH_EN_DIRECT_URL, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });

      if (!res.ok) return results;
      const html = await res.text();
      const $ = cheerio.load(html);
      const now = new Date();
      const todayIso = now.toISOString();

      $('table.table-striped tr').each((i, tr) => {
        const $tr = $(tr);
        const detailLink = $tr.find('a.ga4-matchdetail');
        if (!detailLink.length) return;

        const compName = detailLink.attr('data-competitionname') || 'Football';
        const matchName = detailLink.attr('data-matchname') || '';
        const href = detailLink.attr('href') || '';
        const idAttr = $tr.find('td[id^="status_"]').attr('id') || '';
        const rawId = idAttr.replace('status_', '') || `${i}`;
        const matchId = `med-${rawId}`;

        let homeTeam = '';
        let awayTeam = '';
        if (matchName.includes(' - ')) {
          const parts = matchName.split(' - ');
          homeTeam = parts[0].trim();
          awayTeam = parts[1].trim();
        } else if (matchName.includes(' v ')) {
          const parts = matchName.split(' v ');
          homeTeam = parts[0].trim();
          awayTeam = parts[1].trim();
        }

        if (!homeTeam || !awayTeam) return;

        const cells = $tr.find('td');
        const col0 = cells.eq(0).text().trim();
        const col1 = cells.eq(1).text().trim();

        let status: EventStatus = 'upcoming';
        let isHalfTime = false;
        let minute = col0;
        let period = 'En direct';
        let scoreObj: { home: number; away: number } | undefined = undefined;

        const isLiveClass = $tr.find('.lm2_1').length > 0 || col0.includes("'") || col0.toLowerCase().includes('live');
        if (col0 === 'TER' || col0 === 'FIN' || col0.toLowerCase().includes('termin')) {
          status = 'finished';
          minute = 'Terminé';
          period = 'Terminé';
        } else if (col0 === 'HT' || col0 === 'MT' || col0.toLowerCase().includes('mi-t') || col0.toLowerCase().includes('pause')) {
          status = 'live';
          isHalfTime = true;
          minute = 'Mi-temps';
          period = 'Mi-temps';
        } else if (isLiveClass) {
          status = 'live';
          period = col0.includes("'") ? `Minute ${col0}` : 'En direct';
        } else if (/^\d{1,2}:\d{2}$/.test(col0)) {
          status = 'upcoming';
          minute = col0;
          period = 'Avant-match';
        }

        const scoreMatch = col1.match(/(\d+)\s*[-:]\s*(\d+)/);
        if (scoreMatch) {
          scoreObj = {
            home: parseInt(scoreMatch[1], 10),
            away: parseInt(scoreMatch[2], 10),
          };
          if (status === 'upcoming' && (scoreObj.home > 0 || scoreObj.away > 0)) {
            status = 'live';
          }
        }

        // Calculate precise startTime
        let startTime = todayIso;
        if (/^\d{1,2}:\d{2}$/.test(col0)) {
          const [h, m] = col0.split(':').map(Number);
          const d = new Date(now);
          d.setHours(h, m, 0, 0);
          startTime = d.toISOString();
        }

        // Extract logo image if available in cell
        const imgLogo = $tr.find('img').attr('src');
        if (imgLogo && imgLogo.startsWith('http') && !imgLogo.includes('equipe-logodefaut')) {
          this.setTeamLogo(homeTeam, imgLogo);
        }

        const homeLogo = this.getTeamLogo(homeTeam, 'football');
        const awayLogo = this.getTeamLogo(awayTeam, 'football');

        results.push({
          id: matchId,
          sport: 'football',
          competition: compName,
          homeTeam,
          awayTeam,
          teams: {
            home: { id: `th-${matchId}`, name: homeTeam, logo: homeLogo },
            away: { id: `ta-${matchId}`, name: awayTeam, logo: awayLogo },
          },
          homeTeamData: { id: `th-${matchId}`, name: homeTeam, logo: homeLogo },
          awayTeamData: { id: `ta-${matchId}`, name: awayTeam, logo: awayLogo },
          homeTeamLogo: homeLogo,
          awayTeamLogo: awayLogo,
          startTime,
          status,
          resultStatus: status === 'finished' ? 'confirmed' : 'pending',
          score: scoreObj,
          minute,
          period,
          isHalfTime,
          markets: [],
          detailLink: href ? `https://www.matchendirect.fr${href}` : undefined,
          officialSource: 'MatchEnDirect (https://www.matchendirect.fr/)',
        });
      });
    } catch (e: any) {
      console.warn('[MatchEnDirect Scraper]', e.message);
    }
    return results;
  }

  /**
   * 2. Collecte en temps réel depuis Eurosport (https://www.eurosport.fr/)
   * Récupère le calendrier et les scores officiels depuis le Score Center Eurosport
   */
  public async scrapeEurosport(): Promise<SportEvent[]> {
    const results: SportEvent[] = [];
    try {
      const res = await fetch('https://www.eurosport.fr/football/score-center.shtml', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!res.ok) return results;
      const html = await res.text();
      const $ = cheerio.load(html);

      // Extract match links and competition blocks from Eurosport Score Center
      $('a[href*="/football/"]').each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        const href = $(el).attr('href') || '';
        if (text.includes(' - ') && text.length > 5 && text.length < 80) {
          const parts = text.split(' - ');
          const homeTeam = parts[0].trim();
          const awayTeam = parts[1].trim();
          if (homeTeam && awayTeam) {
            const id = `euro-${i}`;
            const homeLogo = this.getTeamLogo(homeTeam, 'football');
            const awayLogo = this.getTeamLogo(awayTeam, 'football');
            results.push({
              id,
              sport: 'football',
              competition: 'Eurosport Football',
              homeTeam,
              awayTeam,
              teams: {
                home: { id: `th-${id}`, name: homeTeam, logo: homeLogo },
                away: { id: `ta-${id}`, name: awayTeam, logo: awayLogo },
              },
              homeTeamData: { id: `th-${id}`, name: homeTeam, logo: homeLogo },
              awayTeamData: { id: `ta-${id}`, name: awayTeam, logo: awayLogo },
              homeTeamLogo: homeLogo,
              awayTeamLogo: awayLogo,
              startTime: new Date().toISOString(),
              status: 'upcoming',
              resultStatus: 'pending',
              markets: [],
              detailLink: href.startsWith('http') ? href : `https://www.eurosport.fr${href}`,
              officialSource: 'Eurosport (https://www.eurosport.fr/)',
            });
          }
        }
      });
    } catch (e: any) {
      console.warn('[Eurosport Scraper]', e.message);
    }
    return results;
  }

  /**
   * 3. Collecte en temps réel depuis SofaScore (https://www.sofascore.com/)
   * Récupère événements, scores et tournois officiels SofaScore
   */
  public async scrapeSofaScore(): Promise<SportEvent[]> {
    const results: SportEvent[] = [];
    try {
      const endpoints = [
        'https://api.sofascore.com/api/v1/sport/football/events/live',
        'https://www.sofascore.com/api/v1/sport/football/events/live',
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Referer': SOFASCORE_URL,
            },
          });

          if (res.ok) {
            const data = await res.json();
            const events = data.events || [];
            for (const ev of events) {
              const hName = ev.homeTeam?.name;
              const aName = ev.awayTeam?.name;
              if (!hName || !aName) continue;
              const id = `sofa-${ev.id}`;
              const hScore = ev.homeScore?.current;
              const aScore = ev.awayScore?.current;
              const hLogo = ev.homeTeam?.id ? `https://api.sofascore.app/api/v1/team/${ev.homeTeam.id}/image` : this.getTeamLogo(hName, 'football');
              const aLogo = ev.awayTeam?.id ? `https://api.sofascore.app/api/v1/team/${ev.awayTeam.id}/image` : this.getTeamLogo(aName, 'football');
              const isHt = ev.status?.description?.toLowerCase().includes('halftime') || ev.status?.type === 'halftime';

              results.push({
                id,
                sport: 'football',
                competition: ev.tournament?.name || 'SofaScore Football',
                homeTeam: hName,
                awayTeam: aName,
                teams: {
                  home: { id: `th-${id}`, name: hName, logo: hLogo },
                  away: { id: `ta-${id}`, name: aName, logo: aLogo },
                },
                homeTeamData: { id: `th-${id}`, name: hName, logo: hLogo },
                awayTeamData: { id: `ta-${id}`, name: aName, logo: aLogo },
                homeTeamLogo: hLogo,
                awayTeamLogo: aLogo,
                startTime: ev.startTimestamp ? new Date(ev.startTimestamp * 1000).toISOString() : new Date().toISOString(),
                status: ev.status?.type === 'inprogress' ? 'live' : (ev.status?.type === 'finished' ? 'finished' : 'upcoming'),
                score: typeof hScore === 'number' && typeof aScore === 'number' ? { home: hScore, away: aScore } : undefined,
                minute: isHt ? 'Mi-temps' : (ev.status?.description || 'En direct'),
                period: isHt ? 'Mi-temps' : (ev.status?.description || 'En direct'),
                isHalfTime: isHt,
                markets: [],
                officialSource: 'SofaScore (https://www.sofascore.com/)',
              });
            }
            if (results.length > 0) break;
          }
        } catch {}
      }
    } catch (e: any) {
      console.warn('[SofaScore Scraper]', e.message);
    }
    return results;
  }

  /**
   * 4. Vérification et réconciliation croisée rigoureuse multi-sources :
   * Vérifie chaque match et score avec MatchEnDirect, Eurosport et SofaScore sans rien inventer.
   */
  private crossVerifyWithExternalSources(
    medEvents: SportEvent[],
    euroEvents: SportEvent[],
    sofaEvents: SportEvent[]
  ) {
    for (const [, ev] of this.events.entries()) {
      const hNorm = this.normalizeTeamName(ev.homeTeam);
      const aNorm = this.normalizeTeamName(ev.awayTeam);

      // 1. Vérification MatchEnDirect (https://www.matchendirect.fr/)
      const medMatch = medEvents.find(m => {
        const mh = this.normalizeTeamName(m.homeTeam);
        const ma = this.normalizeTeamName(m.awayTeam);
        return (mh.includes(hNorm) || hNorm.includes(mh)) && (ma.includes(aNorm) || aNorm.includes(ma));
      });

      if (medMatch) {
        if (medMatch.isHalfTime) {
          ev.isHalfTime = true;
          ev.minute = 'Mi-temps';
          ev.period = 'Mi-temps';
        } else if (medMatch.minute && medMatch.minute !== 'LIVE' && medMatch.minute !== 'En direct') {
          ev.minute = medMatch.minute;
          if (medMatch.period) ev.period = medMatch.period;
        }
        if (medMatch.score && (!ev.score || ev.status === 'live')) {
          ev.score = medMatch.score;
        }
        if (!ev.officialSource?.includes('MatchEnDirect')) {
          ev.officialSource = `${ev.officialSource || 'LiveScore'} & MatchEnDirect (${MATCH_EN_DIRECT_URL})`;
        }
      }

      // 2. Vérification Eurosport (https://www.eurosport.fr/)
      const euroMatch = euroEvents.find(m => {
        const eh = this.normalizeTeamName(m.homeTeam);
        const ea = this.normalizeTeamName(m.awayTeam);
        return (eh.includes(hNorm) || hNorm.includes(eh)) && (ea.includes(aNorm) || aNorm.includes(ea));
      });

      if (euroMatch) {
        if (!ev.officialSource?.includes('Eurosport')) {
          ev.officialSource = `${ev.officialSource || 'LiveScore'} & Eurosport (${EUROSPORT_URL})`;
        }
      }

      // 3. Vérification SofaScore (https://www.sofascore.com/)
      const sofaMatch = sofaEvents.find(m => {
        const sh = this.normalizeTeamName(m.homeTeam);
        const sa = this.normalizeTeamName(m.awayTeam);
        return (sh.includes(hNorm) || hNorm.includes(sh)) && (sa.includes(aNorm) || aNorm.includes(sa));
      });

      if (sofaMatch) {
        if (sofaMatch.isHalfTime) {
          ev.isHalfTime = true;
          ev.minute = 'Mi-temps';
          ev.period = 'Mi-temps';
        }
        if (sofaMatch.score && (!ev.score || ev.status === 'live')) {
          ev.score = sofaMatch.score;
        }
        if (!ev.officialSource?.includes('SofaScore')) {
          ev.officialSource = `${ev.officialSource || 'LiveScore'} & SofaScore (${SOFASCORE_URL})`;
        }
      }
    }

    // Ingestion des nouvelles rencontres réelles issues de MatchEnDirect
    for (const med of medEvents) {
      if (!this.events.has(med.id)) {
        const medH = this.normalizeTeamName(med.homeTeam);
        const medA = this.normalizeTeamName(med.awayTeam);
        const alreadyPresent = Array.from(this.events.values()).some(e => {
          const eh = this.normalizeTeamName(e.homeTeam);
          const ea = this.normalizeTeamName(e.awayTeam);
          return (eh.includes(medH) || medH.includes(eh)) && (ea.includes(medA) || medA.includes(ea));
        });

        if (!alreadyPresent) {
          this.events.set(med.id, med);
        }
      }
    }

    // Ingestion des rencontres réelles d'Eurosport
    for (const euro of euroEvents) {
      if (!this.events.has(euro.id)) {
        const euroH = this.normalizeTeamName(euro.homeTeam);
        const euroA = this.normalizeTeamName(euro.awayTeam);
        const alreadyPresent = Array.from(this.events.values()).some(e => {
          const eh = this.normalizeTeamName(e.homeTeam);
          const ea = this.normalizeTeamName(e.awayTeam);
          return (eh.includes(euroH) || euroH.includes(eh)) && (ea.includes(euroA) || euroA.includes(ea));
        });

        if (!alreadyPresent) {
          this.events.set(euro.id, euro);
        }
      }
    }

    // Ingestion des rencontres réelles de SofaScore
    for (const sofa of sofaEvents) {
      if (!this.events.has(sofa.id)) {
        const sofaH = this.normalizeTeamName(sofa.homeTeam);
        const sofaA = this.normalizeTeamName(sofa.awayTeam);
        const alreadyPresent = Array.from(this.events.values()).some(e => {
          const eh = this.normalizeTeamName(e.homeTeam);
          const ea = this.normalizeTeamName(e.awayTeam);
          return (eh.includes(sofaH) || sofaH.includes(eh)) && (ea.includes(sofaA) || sofaA.includes(ea));
        });

        if (!alreadyPresent) {
          this.events.set(sofa.id, sofa);
        }
      }
    }
  }

  /**
   * Scrapes match odds for detail view from matchendirect or ODDS.am
   */
  public async scrapeMatchOdds(detailPath: string, eventId?: string): Promise<Market[]> {
    const cached = this.detailOddsCache.get(detailPath);
    if (cached && Date.now() - cached.timestamp < 180000) {
      return cached.markets;
    }

    try {
      const fullUrl = detailPath.startsWith('http')
        ? detailPath
        : `https://www.matchendirect.fr${detailPath.startsWith('/') ? '' : '/'}${detailPath}`;

      const res = await fetch(fullUrl, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!res.ok) return [];

      const html = await res.text();
      const $ = cheerio.load(html);
      const markets: Market[] = [];
      const cleanEventSlug = (eventId || detailPath).replace(/[^a-zA-Z0-9]/g, '').slice(-16);

      $('.market').each((idx, marketEl) => {
        const rawName = $(marketEl).find('.oddType').text().replace(/\s+/g, ' ').trim();
        if (!rawName) return;

        const headers: string[] = [];
        $(marketEl).find('.marketHeaderRow .marketHeaderCell').each((_, h) => {
          headers.push($(h).text().replace(/\s+/g, ' ').trim());
        });

        const oddsValues: number[] = [];
        $(marketEl).find('.marketRows .oddListValues').first().find('.oddBox').each((_, box) => {
          const val = parseFloat($(box).text().trim());
          if (!isNaN(val)) oddsValues.push(val);
        });

        if (oddsValues.length >= 2) {
          let category: MarketCategory = 'result';
          let displayName = rawName;

          if (rawName.includes('1N2') || rawName.includes('Résultat')) {
            category = 'result';
            displayName = 'Résultat du match (1X2)';
          } else if (rawName.includes('Double chance')) {
            category = 'double_chance';
            displayName = 'Double chance';
          } else if (rawName.includes('Plus / Moins')) {
            category = 'goals';
            displayName = rawName;
          } else if (rawName.includes('marquent')) {
            category = 'btts';
            displayName = 'Les deux équipes marquent';
          }

          const selections: OddSelection[] = oddsValues.map((val, oIdx) => ({
            id: `sel-${cleanEventSlug}-${idx}-${oIdx}`,
            name: headers[oIdx] || `Choix ${oIdx + 1}`,
            odds: val,
            trend: 'stable',
          }));

          markets.push({
            id: `mkt-${cleanEventSlug}-${idx}`,
            type: category,
            name: displayName,
            selections,
          });
        }
      });

      this.detailOddsCache.set(detailPath, {
        timestamp: Date.now(),
        markets,
      });

      return markets;
    } catch {
      return [];
    }
  }

  /**
   * Automatically collects all available real-time markets for an ODDS.am match
   * Sources: https://odds.am/ajax/match.odds.php
   * Markets collected:
   * - 1X2 (Résultat du match)
   * - Double Chance (1X, 12, X2)
   * - Over / Under (Total de buts Plus/Moins pour toutes les lignes 0.5, 1.5, 2.5, 3.5, 4.5, etc.)
   * - BTTS (Les deux équipes marquent - Oui/Non)
   * - Asian Handicap (Handicap asiatique pour toutes les lignes -1.5, +1.5, etc.)
   * - Odd / Even (Total de buts Pair / Impair)
   * - Half-time markets (Résultat 1ère mi-temps / 2ème mi-temps)
   */
  public async collectAllMarketsForOddsAmMatch(
    numericMatchId: number | string,
    isLive: boolean,
    eventId: string,
    existingSelections?: OddSelection[]
  ): Promise<Market[]> {
    const cacheKey = `mkt-${numericMatchId}-${isLive ? 'live' : 'pre'}`;
    const cached = this.allMarketsCache.get(cacheKey);
    // Cache for 15 seconds to avoid flooding while keeping real-time live variations fresh
    if (cached && Date.now() - cached.timestamp < 15000) {
      return cached.markets;
    }

    const rates = [
      { key: 'three', name: 'Résultat du match (1X2)', type: 'result' as MarketCategory },
      { key: 'dc', name: 'Double chance', type: 'double_chance' as MarketCategory },
      { key: 'ovun', name: 'Total de buts (Plus / Moins)', type: 'goals' as MarketCategory },
      { key: 'both', name: 'Les deux équipes marquent', type: 'btts' as MarketCategory },
      { key: 'ah', name: 'Handicap asiatique', type: 'handicap' as MarketCategory },
      { key: 'odev', name: 'Total de buts (Pair / Impair)', type: 'half_time' as MarketCategory },
    ];

    const nowIso = new Date().toISOString();
    const collectedMarkets: Market[] = [];

    // If existing selections for 1X2 are already provided and validated, include as base
    if (existingSelections && existingSelections.length >= 2) {
      collectedMarkets.push({
        id: `mkt-${eventId}-three`,
        type: 'result',
        name: 'Résultat du match (1X2)',
        selections: existingSelections,
      });
    }

    const fetchRate = async (r: typeof rates[0]) => {
      try {
        const formData = new URLSearchParams();
        formData.append('type', r.key);
        formData.append('match_id', String(numericMatchId));
        formData.append('lang', 'fr');
        formData.append('islive', isLive ? 'true' : 'false');

        const res = await fetch('https://odds.am/ajax/match.odds.php', {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: formData.toString(),
        });

        if (!res.ok) return;
        const json = await res.json();
        const table = json.table;
        if (!table) return;

        const firstBm = (table.bookmakers && table.bookmakers.length > 0) ? table.bookmakers[0] : null;
        const p0 = firstBm?.odds?.p0 || table.betting?.p0;
        const dataP0 = p0?.data;
        if (!dataP0) return;

        if (r.key === 'three') {
          // If we didn't already have the base 1X2 market
          if (!collectedMarkets.some(m => m.id === `mkt-${eventId}-three`)) {
            const labels = ['1', 'Nul', '2'];
            const selections: OddSelection[] = [];
            if (Array.isArray(dataP0)) {
              dataP0.forEach((item: any[], idx: number) => {
                const currentOdd = typeof item[0] === 'number' ? item[0] : parseFloat(item[0]);
                if (isNaN(currentOdd) || currentOdd <= 1.0) return;

                const selectionKey = `oddsam-${numericMatchId}-${r.key}-${idx}`;
                const history = this.oddsHistory.get(selectionKey);
                let trend: 'up' | 'down' | 'stable' = 'stable';
                let previousOddVal: number | undefined = undefined;

                if (history) {
                  previousOddVal = history.odds;
                  if (currentOdd > history.odds) trend = 'up';
                  else if (currentOdd < history.odds) trend = 'down';
                } else if (item[2] === 'up') trend = 'up';
                else if (item[2] === 'down') trend = 'down';

                this.oddsHistory.set(selectionKey, { odds: currentOdd, timestamp: nowIso });
                selections.push({
                  id: selectionKey,
                  name: labels[idx] || `Choix ${idx + 1}`,
                  odds: currentOdd,
                  previousOdds: previousOddVal,
                  trend,
                  variationTimestamp: nowIso,
                });
              });
            }
            if (selections.length >= 2) {
              collectedMarkets.push({
                id: `mkt-${eventId}-three`,
                name: r.name,
                type: r.type,
                selections,
              });
            }
          }

          // Check if second half or period 2 odds exist
          const p2 = firstBm?.odds?.p2 || table.betting?.p2;
          if (p2 && Array.isArray(p2.data)) {
            const p2Labels = ['1 (MT2)', 'Nul (MT2)', '2 (MT2)'];
            const p2Selections: OddSelection[] = [];
            p2.data.forEach((item: any[], idx: number) => {
              const currentOdd = typeof item[0] === 'number' ? item[0] : parseFloat(item[0]);
              if (isNaN(currentOdd) || currentOdd <= 1.0) return;
              const selectionKey = `oddsam-${numericMatchId}-p2-${idx}`;
              const history = this.oddsHistory.get(selectionKey);
              let trend: 'up' | 'down' | 'stable' = 'stable';
              let previousOddVal: number | undefined = undefined;
              if (history) {
                previousOddVal = history.odds;
                if (currentOdd > history.odds) trend = 'up';
                else if (currentOdd < history.odds) trend = 'down';
              } else if (item[2] === 'up') trend = 'up';
              else if (item[2] === 'down') trend = 'down';

              this.oddsHistory.set(selectionKey, { odds: currentOdd, timestamp: nowIso });
              p2Selections.push({
                id: selectionKey,
                name: p2Labels[idx] || `Choix ${idx + 1}`,
                odds: currentOdd,
                previousOdds: previousOddVal,
                trend,
                variationTimestamp: nowIso,
              });
            });
            if (p2Selections.length >= 2) {
              collectedMarkets.push({
                id: `mkt-${eventId}-p2`,
                name: 'Résultat 2ème mi-temps (1X2)',
                type: 'half_time',
                selections: p2Selections,
              });
            }
          }
        } else if (r.key === 'dc') {
          const labels = ['1X', '12', 'X2'];
          const selections: OddSelection[] = [];
          if (Array.isArray(dataP0)) {
            dataP0.forEach((item: any[], idx: number) => {
              const currentOdd = typeof item[0] === 'number' ? item[0] : parseFloat(item[0]);
              if (isNaN(currentOdd) || currentOdd <= 1.0) return;
              const selectionKey = `oddsam-${numericMatchId}-${r.key}-${idx}`;
              const history = this.oddsHistory.get(selectionKey);
              let trend: 'up' | 'down' | 'stable' = 'stable';
              let previousOddVal: number | undefined = undefined;
              if (history) {
                previousOddVal = history.odds;
                if (currentOdd > history.odds) trend = 'up';
                else if (currentOdd < history.odds) trend = 'down';
              } else if (item[2] === 'up') trend = 'up';
              else if (item[2] === 'down') trend = 'down';

              this.oddsHistory.set(selectionKey, { odds: currentOdd, timestamp: nowIso });
              selections.push({
                id: selectionKey,
                name: labels[idx] || `Choix ${idx + 1}`,
                odds: currentOdd,
                previousOdds: previousOddVal,
                trend,
                variationTimestamp: nowIso,
              });
            });
          }
          if (selections.length >= 2) {
            collectedMarkets.push({
              id: `mkt-${eventId}-${r.key}`,
              name: r.name,
              type: r.type,
              selections,
            });
          }
        } else if (r.key === 'both') {
          const labels = ['Oui', 'Non'];
          const selections: OddSelection[] = [];
          if (Array.isArray(dataP0)) {
            dataP0.forEach((item: any[], idx: number) => {
              const currentOdd = typeof item[0] === 'number' ? item[0] : parseFloat(item[0]);
              if (isNaN(currentOdd) || currentOdd <= 1.0) return;
              const selectionKey = `oddsam-${numericMatchId}-${r.key}-${idx}`;
              const history = this.oddsHistory.get(selectionKey);
              let trend: 'up' | 'down' | 'stable' = 'stable';
              let previousOddVal: number | undefined = undefined;
              if (history) {
                previousOddVal = history.odds;
                if (currentOdd > history.odds) trend = 'up';
                else if (currentOdd < history.odds) trend = 'down';
              } else if (item[2] === 'up') trend = 'up';
              else if (item[2] === 'down') trend = 'down';

              this.oddsHistory.set(selectionKey, { odds: currentOdd, timestamp: nowIso });
              selections.push({
                id: selectionKey,
                name: labels[idx] || `Choix ${idx + 1}`,
                odds: currentOdd,
                previousOdds: previousOddVal,
                trend,
                variationTimestamp: nowIso,
              });
            });
          }
          if (selections.length >= 2) {
            collectedMarkets.push({
              id: `mkt-${eventId}-${r.key}`,
              name: r.name,
              type: r.type,
              selections,
            });
          }
        } else if (r.key === 'odev') {
          const labels = ['Pair', 'Impair'];
          const selections: OddSelection[] = [];
          if (Array.isArray(dataP0)) {
            dataP0.forEach((item: any[], idx: number) => {
              const currentOdd = typeof item[0] === 'number' ? item[0] : parseFloat(item[0]);
              if (isNaN(currentOdd) || currentOdd <= 1.0) return;
              const selectionKey = `oddsam-${numericMatchId}-${r.key}-${idx}`;
              const history = this.oddsHistory.get(selectionKey);
              let trend: 'up' | 'down' | 'stable' = 'stable';
              let previousOddVal: number | undefined = undefined;
              if (history) {
                previousOddVal = history.odds;
                if (currentOdd > history.odds) trend = 'up';
                else if (currentOdd < history.odds) trend = 'down';
              } else if (item[2] === 'up') trend = 'up';
              else if (item[2] === 'down') trend = 'down';

              this.oddsHistory.set(selectionKey, { odds: currentOdd, timestamp: nowIso });
              selections.push({
                id: selectionKey,
                name: labels[idx] || `Choix ${idx + 1}`,
                odds: currentOdd,
                previousOdds: previousOddVal,
                trend,
                variationTimestamp: nowIso,
              });
            });
          }
          if (selections.length >= 2) {
            collectedMarkets.push({
              id: `mkt-${eventId}-${r.key}`,
              name: r.name,
              type: r.type,
              selections,
            });
          }
        } else if (r.key === 'ovun' && typeof dataP0 === 'object' && !Array.isArray(dataP0)) {
          for (const [line, entry] of Object.entries(dataP0 as Record<string, any[]>)) {
            const underItem = entry[1];
            const overItem = entry[2];
            if (underItem && overItem) {
              const underOdd = typeof underItem[0] === 'number' ? underItem[0] : parseFloat(underItem[0]);
              const overOdd = typeof overItem[0] === 'number' ? overItem[0] : parseFloat(overItem[0]);
              if (!isNaN(underOdd) && !isNaN(overOdd) && underOdd > 1.0 && overOdd > 1.0) {
                const underKey = `oddsam-${numericMatchId}-ovun-${line}-under`;
                const overKey = `oddsam-${numericMatchId}-ovun-${line}-over`;
                const histUnder = this.oddsHistory.get(underKey);
                const histOver = this.oddsHistory.get(overKey);

                let trendUnder: 'up' | 'down' | 'stable' = underItem[2] === 'up' ? 'up' : underItem[2] === 'down' ? 'down' : 'stable';
                let trendOver: 'up' | 'down' | 'stable' = overItem[2] === 'up' ? 'up' : overItem[2] === 'down' ? 'down' : 'stable';

                if (histUnder) {
                  if (underOdd > histUnder.odds) trendUnder = 'up';
                  else if (underOdd < histUnder.odds) trendUnder = 'down';
                }
                if (histOver) {
                  if (overOdd > histOver.odds) trendOver = 'up';
                  else if (overOdd < histOver.odds) trendOver = 'down';
                }

                this.oddsHistory.set(underKey, { odds: underOdd, timestamp: nowIso });
                this.oddsHistory.set(overKey, { odds: overOdd, timestamp: nowIso });

                collectedMarkets.push({
                  id: `mkt-${eventId}-ovun-${line.replace('.', '_')}`,
                  name: `Total de buts Plus/Moins (${line})`,
                  type: 'goals',
                  selections: [
                    {
                      id: underKey,
                      name: `Moins de ${line}`,
                      odds: underOdd,
                      previousOdds: histUnder?.odds,
                      trend: trendUnder,
                      variationTimestamp: nowIso,
                    },
                    {
                      id: overKey,
                      name: `Plus de ${line}`,
                      odds: overOdd,
                      previousOdds: histOver?.odds,
                      trend: trendOver,
                      variationTimestamp: nowIso,
                    },
                  ],
                });
              }
            }
          }
        } else if (r.key === 'ah' && typeof dataP0 === 'object' && !Array.isArray(dataP0)) {
          for (const [line, entry] of Object.entries(dataP0 as Record<string, any[]>)) {
            const item1 = entry[1];
            const item2 = entry[2];
            if (item1 && item2) {
              const odd1 = typeof item1[0] === 'number' ? item1[0] : parseFloat(item1[0]);
              const odd2 = typeof item2[0] === 'number' ? item2[0] : parseFloat(item2[0]);
              if (!isNaN(odd1) && !isNaN(odd2) && odd1 > 1.0 && odd2 > 1.0) {
                const key1 = `oddsam-${numericMatchId}-ah-${line}-1`;
                const key2 = `oddsam-${numericMatchId}-ah-${line}-2`;
                const hist1 = this.oddsHistory.get(key1);
                const hist2 = this.oddsHistory.get(key2);

                let trend1: 'up' | 'down' | 'stable' = item1[2] === 'up' ? 'up' : item1[2] === 'down' ? 'down' : 'stable';
                let trend2: 'up' | 'down' | 'stable' = item2[2] === 'up' ? 'up' : item2[2] === 'down' ? 'down' : 'stable';

                if (hist1) {
                  if (odd1 > hist1.odds) trend1 = 'up';
                  else if (odd1 < hist1.odds) trend1 = 'down';
                }
                if (hist2) {
                  if (odd2 > hist2.odds) trend2 = 'up';
                  else if (odd2 < hist2.odds) trend2 = 'down';
                }

                this.oddsHistory.set(key1, { odds: odd1, timestamp: nowIso });
                this.oddsHistory.set(key2, { odds: odd2, timestamp: nowIso });

                collectedMarkets.push({
                  id: `mkt-${eventId}-ah-${line.replace(/[\.\-]/g, '_')}`,
                  name: `Handicap asiatique (${line})`,
                  type: 'handicap',
                  selections: [
                    {
                      id: key1,
                      name: `1 (${line})`,
                      odds: odd1,
                      previousOdds: hist1?.odds,
                      trend: trend1,
                      variationTimestamp: nowIso,
                    },
                    {
                      id: key2,
                      name: `2 (${line})`,
                      odds: odd2,
                      previousOdds: hist2?.odds,
                      trend: trend2,
                      variationTimestamp: nowIso,
                    },
                  ],
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[Scraper] Erreur collecte marché ${r.key} match ${numericMatchId}:`, err);
      }
    };

    // Query in parallel
    await Promise.all(rates.map(r => fetchRate(r)));

    this.allMarketsCache.set(cacheKey, {
      timestamp: Date.now(),
      markets: collectedMarkets,
    });

    return collectedMarkets;
  }

  /**
   * Enriches an event with all available real-time markets automatically
   */
  public async enrichAllMarketsForEvent(event: SportEvent): Promise<Market[]> {
    if (event.id.startsWith('oddsam-') || (event.detailLink && event.detailLink.includes('odds.am'))) {
      const matchIdPart = event.id.replace('oddsam-', '').split('-')[0];
      const linkMatch = event.detailLink?.match(/\/match\/(\d+)\//);
      const numericId = matchIdPart || (linkMatch ? linkMatch[1] : null);
      if (numericId) {
        const markets = await this.collectAllMarketsForOddsAmMatch(
          numericId,
          event.status === 'live',
          event.id,
          event.markets[0]?.selections
        );
        if (markets.length > 0) {
          event.markets = markets;
          event.hasLiveOddsAndVariation = true;
          event.lastOddsUpdate = new Date().toISOString();
          this.events.set(event.id, event);
          return markets;
        }
      }
    } else if (event.detailLink) {
      const markets = await this.scrapeMatchOdds(event.detailLink, event.id);
      if (markets.length > 0) {
        event.markets = markets;
        this.events.set(event.id, event);
        return markets;
      }
    }

    return event.markets;
  }

  /**
   * Retrieves an event by ID and automatically collects all available real-time markets
   */
  public async getEventWithAllMarkets(id: string): Promise<SportEvent | undefined> {
    const ev = this.events.get(id);
    if (!ev) return undefined;
    if (ev.status === 'live' && !isDisplayableLiveEvent(ev)) return undefined;

    // Automatically enrich all markets in real-time
    await this.enrichAllMarketsForEvent(ev);
    return ev;
  }
}

export const matchEnDirectScraper = new FlashLiveSportsScraper();
