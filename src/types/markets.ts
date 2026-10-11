import { MarketCategory } from './index';
import { BookmakerCategory, BookmakerMarketEntry, SelectionOddsData } from './odds';

export type MarketStatus = 'OPEN' | 'SUSPENDED' | 'CLOSED';

export type OddsAmMarketKey =
  | 'three' // 1-X-2 (Résultat du match)
  | 'dnb' // Draw No Bet (Résultat hors nul)
  | 'dc' // Double Chance (Chance double)
  | 'ovun' // Over/Under (Moins/Plus)
  | 'ah' // Asian Handicap (Handicap asiatique)
  | 'first' // Premier buteur / 1re équipe à marquer
  | 'pen' // Pénalty accordé
  | 'both' // Both Teams To Score (Les deux équipes marquent)
  | 'odev' // Pair / Impair (Odd/Even)
  | 'ht' // Mi-temps (Half-time)
  | 'corners' // Corners
  | 'cards' // Cartons
  | string;

export interface NormalizedSelection extends SelectionOddsData {
  id: string;
  name: string;
  odds: number;
  previousOdds?: number | null;
  variation?: number | null;
  trend?: 'UP' | 'DOWN' | 'STABLE' | null;
  bookmakerId?: string;
  bookmakerName?: string;
  isBest?: boolean;
}

export interface NormalizedMarket {
  id: string;
  type: MarketCategory;
  name: string;
  status: MarketStatus;
  selections: NormalizedSelection[];
  bookmakers?: BookmakerMarketEntry[];
  rawKey?: string;
  period?: number; // 0 = match complet, 1 = 1re mi-temps, 2 = 2e mi-temps
  line?: number; // Pour Over/Under (e.g. 2.5) ou Handicap (e.g. -1.5)
}

export interface MatchMarketsContainer {
  matchId: string;
  preMatchMarkets: NormalizedMarket[];
  inPlayMarkets: NormalizedMarket[];
  allMarkets: NormalizedMarket[];
  lastUpdated: string;
}
