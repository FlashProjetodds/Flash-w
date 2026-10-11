export type UserRole = 'user' | 'admin';

export interface User {
  id: string; // e.g. FL328741
  name: string;
  email: string;
  password: string;
  role: UserRole;
  balance: number;
  createdAt: string;
  phone?: string;
}

export type TransactionType =
  | 'DEPOSIT'
  | 'BET_STAKE_DEBIT'
  | 'BET_WIN_PAYOUT'
  | 'BET_REFUND'
  | 'ADJUSTMENT'
  | 'credit'
  | 'debit';

export interface BalanceTransaction {
  id: string; // e.g. TX-DEBIT-FLASH-C-49578 or SETTLE-WIN-FLASH-C-49578
  userId: string;
  amount: number;
  type: TransactionType;
  timestamp: string;
  adminResponsible: string; // Admin's unique ID, or 'Système FLASH (Règlement)'
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
  betId?: string;
  couponId?: string;
}

export type EventStatus =
  | 'upcoming'
  | 'live'
  | 'halftime'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'suspended'
  | 'abandoned'
  | 'unknown';

export type ResultStatus = 'pending' | 'confirmed' | 'unconfirmed';

export type MarketCategory =
  | 'result'
  | 'double_chance'
  | 'goals'
  | 'btts'
  | 'half_time'
  | 'handicap'
  | 'corners'
  | 'cards'
  | 'players'
  | 'live'
  | 'stats'
  | 'intervals'
  | 'exact_score'
  | string;

export interface OddSelection {
  id: string;
  name: string; // e.g. "1", "Nul", "2", "Plus de 2.5", "Oui"
  odds: number; // e.g. 1.85
  trend?: 'up' | 'down' | 'stable'; // ↗ or ↘
  previousOdds?: number;
  variation?: string | number;
  variationTimestamp?: string;
  bookmaker?: string;
  bookmakerId?: string;
  isSuspended?: boolean;
  isBest?: boolean;
}

export interface Market {
  id: string;
  type: MarketCategory;
  name: string; // e.g. "Résultat du match", "Double chance", "Nombre de buts"
  selections: OddSelection[];
  isSuspended?: boolean;
  isLive?: boolean;
}

export interface MarketSnapshot {
  marketId: string;
  marketName: string;
  marketType: MarketCategory | string;
  selectionId: string;
  selectionName: string;
  displaySelection: string; // e.g. "1 — Canada gagne"
  odds: number;
}

export interface EventStatistics {
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  corners?: { home: number; away: number };
  yellowCards?: { home: number; away: number };
  redCards?: { home: number; away: number };
  fouls?: { home: number; away: number };
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
}

export type SupportedSport =
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'hockey'
  | 'handball'
  | 'volleyball'
  | 'futsal'
  | 'cricket'
  | 'american-football'
  | 'rugby'
  | 'tennis-de-table'
  | 'mma-boxing'
  | 'baseball'
  | 'unihockey'
  | string;

export interface SportEvent {
  id: string;
  sport: SupportedSport;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  teams?: {
    home: Team;
    away: Team;
  };
  homeTeamData?: Team;
  awayTeamData?: Team;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  startTime: string; // ISO date string
  status: EventStatus;
  resultStatus?: ResultStatus;
  score?: {
    home: number;
    away: number;
    detail?: string; // e.g. sets for tennis "6-4, 4-3", or quarters "24-21, 28-24"
  };
  scoreHome?: number;
  scoreAway?: number;
  minute?: string; // e.g. "68'", "45+2'", "3e QT", "Terminé", "TER", "Mi-temps"
  period?: string; // e.g. "2e mi-temps", "3e set", "Mi-temps"
  isHalfTime?: boolean; // Indique si le match est actuellement en pause mi-temps
  elapsedMinutes?: number; // Temps de jeu écoulé depuis le coup d'envoi
  elapsedTime?: string;
  statistics?: EventStatistics;
  markets: Market[];
  odds?: any;
  events?: any[];
  sourceReferences?: SourceReference[];
  detailLink?: string;
  finishedAt?: string;
  officialSource?: string;
  hasLiveOddsAndVariation?: boolean;
  lastOddsUpdate?: string;
  lastUpdate?: string;
  freshnessStatus?: string;
  confidenceScore?: number;
  isVerified?: boolean;
}

export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'void';
export type SettlementStatus = 'pending' | 'settled' | 'refunded';

export interface CouponSelection {
  id: string;
  betId?: string;
  couponId?: string;
  eventId: string;
  sport: string;
  competition: string;
  date?: string;
  heure?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  marketId: string;
  marketName: string;
  marketType?: MarketCategory | string;
  marketSnapshot?: MarketSnapshot;
  selectionId: string;
  selectionName: string;
  selectedValue?: string;
  displaySelection: string; // e.g. "1 — Canada gagne"
  oddsAtPlacement: number;
  odds: number;
  stake?: number;
  eventStatusAtPlacement?: EventStatus;
  selectionStatus?: 'pending' | 'won' | 'lost' | 'void';
  status: BetStatus;
  finalScoreHome?: number;
  finalScoreAway?: number;
  resultStatus?: ResultStatus;
  settlementStatus?: SettlementStatus;
  source?: string;
  officialResult?: string;
  createdAt?: string;
  settledAt?: string;
  // Legacy compatibility
  eventName?: string;
}

export interface Coupon {
  id: string; // e.g. FLASH-C-72819
  userId: string;
  type: 'simple' | 'combined';
  selections: CouponSelection[];
  totalOdds: number;
  initialTotalOdds?: number;
  amount: number; // stake
  potentialPayout: number;
  actualPayout?: number; // 0 if lost, refunded if void, won amount if won
  status: BetStatus; // 'pending' | 'won' | 'lost' | 'cancelled' | 'void'
  settlementStatus: SettlementStatus; // 'pending' | 'settled' | 'refunded'
  settlementId?: string;
  officialResultSummary?: string;
  createdAt: string;
  settledAt?: string;
}

export interface Bet {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  sport: string;
  competition: string;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  marketId?: string;
  marketName: string;
  marketType?: MarketCategory | string;
  marketSnapshot?: MarketSnapshot;
  selectionId: string;
  selectionName: string;
  selectedValue?: string;
  displaySelection?: string;
  oddsAtPlacement?: number;
  odds: number;
  amount: number;
  potentialPayout: number;
  actualPayout?: number;
  status: BetStatus;
  settlementStatus: SettlementStatus;
  settlementId?: string;
  finalScoreHome?: number;
  finalScoreAway?: number;
  resultStatus?: ResultStatus;
  officialResult?: string;
  createdAt: string;
  settledAt?: string;
  couponId?: string;
}

export type AppView =
  | 'home'
  | 'live'
  | 'today'
  | 'upcoming'
  | 'sports'
  | 'match_detail'
  | 'my_bets'
  | 'balance'
  | 'profile'
  | 'admin_balance'
  | 'gaming'
  | 'auth';

export type MatchFlash = SportEvent;

export type DataSourceId =
  | 'livescore'
  | 'thesportsdb'
  | 'matchendirect'
  | 'sofascore'
  | 'apifootball'
  | 'oddsapi'
  | 'sportscore'
  | 'eurosport'
  | string;

export interface DataSourceConfig {
  id: DataSourceId;
  name: string;
  url: string;
  type?: 'api' | 'feed' | string;
  category?: 'primary_live_odds' | 'primary_live_scores' | 'supplementary' | 'enrichment' | string;
  enabled: boolean;
  priority: number;
  syncIntervalSeconds?: number;
  endpoint?: string;
  requiresApiKey?: boolean;
  apiKeyEnvVar?: string;
  hasApiKey?: boolean;
  apiKey?: string;
  lastSync?: string | null;
  lastSyncAt?: string;
  responseTimeMs?: number | null;
  eventsCount?: number;
  matchesCount?: number;
  successRate?: number;
  status: 'offline' | 'needs_key' | 'online' | 'rate_limited' | 'active' | 'standby' | 'error' | 'syncing';
  supportedData: string[];
  errorCount?: number;
  lastError?: string | null;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source?: string;
  message: string;
  details?: any;
}

export interface SourceReference {
  sourceId: DataSourceId;
  sourceName: string;
  externalId?: string;
  extractedAt?: string;
  lastSync?: string;
  fieldsProvided?: string[];
  isPrimary?: boolean;
  rawOdds?: any;
  confidenceScore?: number;
}

