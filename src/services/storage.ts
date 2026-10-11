import { User, BalanceTransaction, Bet, SportEvent } from '../types';

const USERS_KEY = 'flash_users_v1';
const CURRENT_USER_KEY = 'flash_current_user_v1';
const TRANSACTIONS_KEY = 'flash_transactions_v1';
const BETS_KEY = 'flash_bets_v1';
const EVENTS_KEY = 'flash_events_v1';

// Seed initial admin user if not present
function getInitialUsers(): User[] {
  const adminUser: User = {
    id: 'FL000001',
    name: 'Administrateur FLASH',
    email: 'admin@flash.sport',
    password: 'AdminPassword2026!',
    role: 'admin',
    balance: 0,
    createdAt: new Date().toISOString(),
  };

  return [adminUser];
}

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const initial = getInitialUsers();
      localStorage.setItem(USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    const users = JSON.parse(raw) as User[];
    // Ensure admin user exists
    if (!users.some(u => u.role === 'admin')) {
      users.unshift(getInitialUsers()[0]);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  } catch {
    return getInitialUsers();
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function generateUniqueUserId(): string {
  const users = loadUsers();
  let candidate = '';
  do {
    const num = Math.floor(100000 + Math.random() * 900000);
    candidate = `FL${num}`;
  } while (users.some(u => u.id === candidate));
  return candidate;
}

export function findUserById(id: string): User | undefined {
  const cleanId = id.trim().toUpperCase();
  const users = loadUsers();
  return users.find(u => u.id.toUpperCase() === cleanId || u.email.toLowerCase() === id.trim().toLowerCase());
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as User;
    // Always fetch fresh user state from storage to avoid stale balance
    const fresh = loadUsers().find(u => u.id === session.id);
    return fresh || null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

/**
 * Clears all user session-specific data from storage (called on logout)
 */
export function clearAllUserSessionData(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem('flash_temp_slip_v1');
    }
  } catch {}
}

// Transactions audit log
export function loadTransactions(): BalanceTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: BalanceTransaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

// Balance Management with strict authorization checks
export function adminCreditBalance(
  admin: User,
  targetUserId: string,
  amount: number,
  notes?: string
): { success: boolean; error?: string; transaction?: BalanceTransaction; updatedUser?: User } {
  if (admin.role !== 'admin') {
    return { success: false, error: 'Accès refusé. Privilèges administrateur requis.' };
  }

  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Veuillez saisir un montant valide supérieur à 0.' };
  }

  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id.toUpperCase() === targetUserId.trim().toUpperCase());

  if (userIndex === -1) {
    return { success: false, error: `Utilisateur introuvable avec l'identifiant ${targetUserId}.` };
  }

  const target = users[userIndex];
  const balanceBefore = target.balance;
  const balanceAfter = Number((balanceBefore + amount).toFixed(2));

  // Update target user balance
  target.balance = balanceAfter;
  users[userIndex] = target;
  saveUsers(users);

  // If current user is this user or admin, refresh session
  const current = getCurrentUser();
  if (current && current.id === target.id) {
    setCurrentUser(target);
  }

  // Create audit transaction
  const transaction: BalanceTransaction = {
    id: `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: target.id,
    amount,
    type: 'credit',
    timestamp: new Date().toISOString(),
    adminResponsible: `${admin.name} (${admin.id})`,
    balanceBefore,
    balanceAfter,
    notes: notes || 'Crédit de solde accordé par administrateur',
  };

  const transactions = loadTransactions();
  transactions.unshift(transaction);
  saveTransactions(transactions);

  return { success: true, transaction, updatedUser: target };
}

export function adminDebitBalance(
  admin: User,
  targetUserId: string,
  amount: number,
  notes?: string
): { success: boolean; error?: string; transaction?: BalanceTransaction; updatedUser?: User } {
  if (admin.role !== 'admin') {
    return { success: false, error: 'Accès refusé. Privilèges administrateur requis.' };
  }

  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Veuillez saisir un montant valide supérieur à 0.' };
  }

  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id.toUpperCase() === targetUserId.trim().toUpperCase());

  if (userIndex === -1) {
    return { success: false, error: `Utilisateur introuvable avec l'identifiant ${targetUserId}.` };
  }

  const target = users[userIndex];

  if (target.balance < amount) {
    return {
      success: false,
      error: `Débit impossible : le montant (${Math.round(amount).toLocaleString('fr-FR')} FCFA) dépasse le solde disponible (${Math.round(target.balance).toLocaleString('fr-FR')} FCFA). Aucun solde négatif n'est autorisé.`,
    };
  }

  const balanceBefore = target.balance;
  const balanceAfter = Number((balanceBefore - amount).toFixed(2));

  // Update target user balance
  target.balance = balanceAfter;
  users[userIndex] = target;
  saveUsers(users);

  // Update current user session if needed
  const current = getCurrentUser();
  if (current && current.id === target.id) {
    setCurrentUser(target);
  }

  // Create audit transaction
  const transaction: BalanceTransaction = {
    id: `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: target.id,
    amount,
    type: 'debit',
    timestamp: new Date().toISOString(),
    adminResponsible: `${admin.name} (${admin.id})`,
    balanceBefore,
    balanceAfter,
    notes: notes || 'Débit de solde effectué par administrateur',
  };

  const transactions = loadTransactions();
  transactions.unshift(transaction);
  saveTransactions(transactions);

  return { success: true, transaction, updatedUser: target };
}

// Bets persistence
export function loadBets(userId?: string): Bet[] {
  try {
    const raw = localStorage.getItem(BETS_KEY);
    const bets: Bet[] = raw ? JSON.parse(raw) : [];
    if (userId) {
      return bets.filter(b => b.userId === userId);
    }
    return bets;
  } catch {
    return [];
  }
}

export function saveBets(bets: Bet[]): void {
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
}

export function placeUserBet(
  user: User,
  betData: Omit<Bet, 'id' | 'createdAt' | 'userId' | 'potentialPayout' | 'status' | 'settlementStatus'>
): { success: boolean; error?: string; bet?: Bet; updatedUser?: User } {
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex === -1) {
    return { success: false, error: 'Compte utilisateur non trouvé.' };
  }

  const currentUser = users[userIndex];
  if (currentUser.balance < betData.amount) {
    return {
      success: false,
      error: `Solde insuffisant (${Math.round(currentUser.balance).toLocaleString('fr-FR')} FCFA). Contactez l'administrateur pour créditer votre compte.`,
    };
  }

  // Deduct stake
  const balanceBefore = currentUser.balance;
  currentUser.balance = Number((balanceBefore - betData.amount).toFixed(2));
  users[userIndex] = currentUser;
  saveUsers(users);
  setCurrentUser(currentUser);

  const betId = `BET-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const nowIso = new Date().toISOString();

  // Create debit transaction
  const tx: BalanceTransaction = {
    id: `TX-DEBIT-${betId}`,
    userId: currentUser.id,
    amount: betData.amount,
    type: 'BET_STAKE_DEBIT',
    timestamp: nowIso,
    adminResponsible: 'Système FLASH (Prise de Pari Simple)',
    balanceBefore,
    balanceAfter: currentUser.balance,
    notes: `Mise engagée pour le pari simple #${betId}`,
    betId,
  };

  const transactions = loadTransactions();
  transactions.unshift(tx);
  saveTransactions(transactions);

  const newBet: Bet = {
    ...betData,
    id: betId,
    userId: currentUser.id,
    potentialPayout: Number((betData.amount * betData.odds).toFixed(2)),
    status: 'pending',
    settlementStatus: 'pending',
    createdAt: nowIso,
  };

  const allBets = loadBets();
  allBets.unshift(newBet);
  saveBets(allBets);

  return { success: true, bet: newBet, updatedUser: currentUser };
}

/**
 * Recomputes user balance from the immutable ledger of transactions
 */
export function recalculateUserBalanceFromTransactions(userId: string): number {
  const transactions = loadTransactions().filter(t => t.userId === userId);
  let computed = 0;
  // Transactions are ordered newest first, sort oldest first to calculate progressive balance
  const chronological = [...transactions].reverse();
  for (const tx of chronological) {
    if (tx.type === 'DEPOSIT' || tx.type === 'BET_WIN_PAYOUT' || tx.type === 'BET_REFUND' || tx.type === 'credit') {
      computed += tx.amount;
    } else if (tx.type === 'BET_STAKE_DEBIT' || tx.type === 'debit') {
      computed -= tx.amount;
    } else if (tx.type === 'ADJUSTMENT') {
      computed += tx.amount;
    }
  }
  return Math.max(0, Number(computed.toFixed(2)));
}

const ARCHIVED_EVENTS_KEY = 'flash_archived_events_v1';
const SOURCES_PURGED_KEY = 'flash_sources_purged_v1';

/**
 * Supprime toutes les sources de données, événements et caches associés
 */
export function purgeAllDataSourcesAndEvents(): void {
  try {
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(ARCHIVED_EVENTS_KEY);
    localStorage.setItem(SOURCES_PURGED_KEY, 'true');
  } catch {}
}

// Events persistence & real connector storage
export function loadSavedEvents(): SportEvent[] {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(SOURCES_PURGED_KEY) !== 'true') {
      purgeAllDataSourcesAndEvents();
      return [];
    }
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: SportEvent[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// Archived Events persistence for historical settlement & 'Mes Paris'
export function loadArchivedEvents(): SportEvent[] {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(SOURCES_PURGED_KEY) !== 'true') {
      purgeAllDataSourcesAndEvents();
      return [];
    }
    const raw = localStorage.getItem(ARCHIVED_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveArchivedEvents(events: SportEvent[]): void {
  localStorage.setItem(ARCHIVED_EVENTS_KEY, JSON.stringify(events));
}

export function archiveEvent(event: SportEvent): void {
  const archived = loadArchivedEvents();
  const index = archived.findIndex(e => e.id === event.id);
  if (index >= 0) {
    archived[index] = event;
  } else {
    archived.unshift(event);
  }
  saveArchivedEvents(archived);
}

// ==========================================
// Persistent 'previousSnapshot' store for Odds
// ==========================================

export interface OddsSnapshotEntry {
  odds: number;
  timestamp: string;
  marketName?: string;
  selectionName?: string;
  bookmaker?: string;
}

export type EventOddsSnapshot = Record<string, OddsSnapshotEntry>; // Key: `${marketId}__${selectionId}`
export type PreviousSnapshotStore = Record<string, EventOddsSnapshot>; // Key: eventId

const PREVIOUS_SNAPSHOT_KEY = 'flash_previous_snapshot_v1';

export function loadPreviousSnapshotStore(): PreviousSnapshotStore {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(PREVIOUS_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePreviousSnapshotStore(store: PreviousSnapshotStore): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PREVIOUS_SNAPSHOT_KEY, JSON.stringify(store));
  } catch {}
}

export function clearPreviousSnapshotStore(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(PREVIOUS_SNAPSHOT_KEY);
  } catch {}
}


