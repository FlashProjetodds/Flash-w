/**
 * Types pour les données brutes et structures internes ODDS.am
 */

export type OddsAmConnectionStatus = 'CONNECTED' | 'DEGRADED' | 'OFFLINE';

export interface OddsAmRawRow {
  team1: string;
  team2: string;
  img1?: string | false;
  img2?: string | false;
  score?: string;
  url: string;
  live?: boolean;
  tooltip?: string;
}

export interface OddsAmLeagueTable {
  title: string;
  img?: string | boolean;
  rows: OddsAmRawRow[];
}

export interface OddsAmMenu {
  [sportKey: string]: string; // e.g. "sport1": "Football", "sport2": "Hockey sur glace"
}

export interface OddsAmDiscoveredEvent {
  matchId: string;
  sportKey: string;
  sportName: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  score?: string;
  isLive: boolean;
  liveTooltip?: string;
  url: string;
  discoveredAt: string;
  isTomorrow?: boolean;
}

export interface OddsAmRateColumnDefinition {
  name: string;
  cols: string[]; // e.g. ["1", "X", "2"] or ["1X", "12", "X2"] or ["", "Moins", "Plus"]
  keys: string[]; // e.g. ["rate1", "ratex", "rate2"]
  icons: string[];
  empty: boolean;
}

export interface OddsAmFilterRates {
  [marketType: string]: OddsAmRateColumnDefinition;
}

export interface OddsAmBookmakerInfo {
  id: string; // Extracted from link, e.g. "4" from "/redir/go.php?bid=4"
  name?: string;
  logo: string;
  link: string;
  rating: number;
  rating255?: string;
  flag?: string | null;
}

export interface OddsAmOddsDataRow {
  period: number; // 0 = match, 1 = 1ère MT, 2 = 2ème MT
  payout?: number;
  data: [number, string, string, string, boolean][];
}

export interface OddsAmBookmakerOdds {
  bookmaker: {
    logo: string;
    link: string;
    rating: number;
    rating255?: string;
    flag?: string | null;
  };
  odds: {
    [periodKey: string]: {
      period: number;
      payout?: number;
      data: [number, string, string, string, boolean][];
    };
  };
}

export interface OddsAmOddsResponse {
  filter?: {
    tableId: string;
    rates?: OddsAmFilterRates;
    visibleRows?: number;
  };
  table?: {
    matchId: number | string;
    isLive: boolean;
    bookmakers?: OddsAmBookmakerOdds[];
    betting?: any;
    periods_info?: any;
    periods_info_short?: any;
  };
  bmcount?: number;
}

export interface OddsAmAdminStats {
  status: OddsAmConnectionStatus;
  lastSyncTime: string | null;
  sportsCount: number;
  sportsList: { key: string; name: string; matchCount: number }[];
  matchesCount: number;
  liveMatchesCount: number;
  upcomingMatchesCount: number;
  marketsCount: number;
  bookmakersCount: number;
  lastError: string | null;
  isEnabled: boolean;
}

export interface OddsAmLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}
