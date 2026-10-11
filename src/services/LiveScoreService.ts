import { SportEvent } from '../types';

interface LiveScoreMatch {
  id: string;
  sport: string;
  competition: string;
  home_team: string;
  away_team: string;
  score_home: number;
  score_away: number;
  time_elapsed: string;
  status: 'live' | 'upcoming' | 'finished';
}

export class LiveScoreService {
  private static instance: LiveScoreService;
  private endpoint: string = 'https://api.livescore.com/v1/matches.json'; // À remplacer par votre endpoint réel ou proxy

  private constructor() {}

  public static getInstance(): LiveScoreService {
    if (!LiveScoreService.instance) {
      LiveScoreService.instance = new LiveScoreService();
    }
    return LiveScoreService.instance;
  }

  public async fetchLiveMatches(): Promise<SportEvent[]> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LiveScoreMatch[] = await response.json();

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((match) => ({
        id: match.id,
        sport: match.sport || 'football',
        competition: match.competition || 'Compétition',
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        score: { 
          home: match.score_home ?? 0, 
          away: match.score_away ?? 0 
        },
        elapsedMinutes: match.time_elapsed ? parseInt(match.time_elapsed.replace("'", ""), 10) || 0 : 0,
        elapsedTime: match.time_elapsed || '0\'',
        status: match.status || 'upcoming',
        startTime: new Date().toISOString(),
        markets: [],
        teams: { 
          home: { name: match.home_team }, 
          away: { name: match.away_team } 
        }
      }));
    } catch (error: any) {
      console.warn('[LiveScoreService] Impossible de récupérer les scores en direct :', error.message);
      return [];
    }
  }
}

export const liveScoreService = LiveScoreService.getInstance();
