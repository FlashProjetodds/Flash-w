import { Market, EventStatus, Team } from './index';

export type OddsVariationType = 'UP' | 'DOWN' | 'STABLE' | null;

export interface BookmakerOddEntry {
  matchId: string;
  bookmakerId: string;
  bookmakerName: string;
  bookmakerLogo: string;
  marketKey: string;
  selectionKey: string;
  odd: number;
  previousOdd?: number;
  variation: OddsVariationType;
  timestamp: string;
}

export interface OddsAmEvent {
  id: string; // Dynamic matchId (e.g. "41535657")
  matchId: string;
  sport: string; // e.g. "football", "hockey", "basketball", "tennis", "handball"
  sportKey: string; // e.g. "sport1", "sport2"
  competition: string;
  homeTeam: string;
  awayTeam: string;
  teams: {
    home: Team;
    away: Team;
  };
  score?: {
    home: number;
    away: number;
    detail?: string;
  };
  status: EventStatus;
  isLive: boolean;
  minute?: string;
  startTime: string; // ISO format
  markets: Market[];
  source: 'odds.am';
  lastOddsUpdate?: string;
  url: string;
}
