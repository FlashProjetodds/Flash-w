/**
 * Types pour la gestion des cotes réelles, des bookmakers et des variations
 * Strictement conforme : aucune cote ni variation fictive
 */

export type OddsTrend = 'UP' | 'DOWN' | 'STABLE' | null;

export type BookmakerCategory = 'all' | 'classic' | 'crypto';

export interface BookmakerInfo {
  id: string;
  name: string;
  category: BookmakerCategory;
  logo?: string;
  rating?: number;
  url?: string;
}

export interface SelectionOddsData {
  selectionId: string;
  selectionName: string; // e.g. "1", "X", "2", "Over 2.5", "Under 2.5", "Oui", "Non"
  odds: number;
  previousOdds?: number | null;
  variation?: number | null;
  trend?: OddsTrend;
  isSuspended?: boolean;
  bookmakerId?: string;
  bookmakerName?: string;
  bookmakerCategory?: BookmakerCategory;
  timestamp?: string;
}

export interface BookmakerMarketEntry {
  bookmakerId: string;
  bookmakerName: string;
  category: BookmakerCategory;
  logo?: string;
  selections: SelectionOddsData[];
  updatedAt?: string;
}

export interface EncryptedFeedPayload {
  data?: string; // Base64 ciphertext
  iv?: string; // Base64 IV
  passB64?: string;
  saltB64?: string;
  hash?: string;
}

export interface DecryptionResult<T = any> {
  success: boolean;
  decryptedData?: T;
  error?: string;
  reason?: 'MISSING_CREDENTIALS' | 'KEY_MISMATCH' | 'CORRUPTED_CIPHERTEXT' | 'UNSUPPORTED';
}
