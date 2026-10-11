import {
  SportEvent,
  Bet,
  Coupon,
  CouponSelection,
  BalanceTransaction,
  User,
  MarketCategory,
  MarketSnapshot,
  BetStatus,
} from '../types';
import {
  loadBets,
  saveBets,
  loadUsers,
  saveUsers,
  loadTransactions,
  saveTransactions,
  getCurrentUser,
  setCurrentUser,
} from './storage';
import { formatSelectionDisplay } from '../utils/selectionDisplay';

/**
 * FLASH Settlement Engine — Moteur de Règlement Automatique, Idempotent et Sécurisé
 *
 * Principes stricts :
 * 1. Aucun résultat fictif ou simulé. Seules les données réelles confirmées sont utilisées.
 * 2. Protection absolue contre le double règlement / double crédit via settlementId unique et journal des transactions.
 * 3. Gestion précise des statuts d'événements :
 *    - FINISHED : score final confirmé -> évaluation des sélections et règlement.
 *    - POSTPONED : match reporté -> conservé EN ATTENTE jusqu'à la nouvelle date.
 *    - CANCELLED : match définitivement annulé -> sélection VOID, remboursement de la mise si applicable.
 *    - SUSPENDED / ABANDONED : match suspendu/interrompu -> EN ATTENTE en attente de décision officielle.
 * 4. Combiné :
 *    - Si au moins une sélection est PERDANTE (LOST) -> coupon entier = PERDU (gain = 0).
 *    - Si toutes les sélections sont GAGNÉES (WON) -> coupon entier = GAGNÉ (gain crédité UNE SEULE FOIS).
 *    - Si sélections neutralisées (VOID/CANCELLED) : recalcul de la cote combinée (cote 1.00 pour les void).
 *    - Si des sélections sont EN ATTENTE (PENDING) et aucune perdante -> coupon = EN ATTENTE.
 */

export interface SelectionOutcome {
  status: 'won' | 'lost' | 'void' | 'pending';
  determined: boolean;
  resultStr: string;
  finalScoreHome?: number;
  finalScoreAway?: number;
}

/**
 * Normalise un nom d'équipe pour la comparaison souple
 */
export function normalizeName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Vérifie si un événement est officiellement et définitivement terminé auprès de la source réelle.
 */
export function isEventConfirmedFinished(event: SportEvent): boolean {
  if (!event) return false;

  const min = (event.minute || '').toLowerCase().trim();
  const per = (event.period || '').toLowerCase().trim();
  const stat = (event.status || '').toLowerCase().trim();

  const isFinishedStatus =
    stat === 'finished' ||
    min === 'ter' ||
    min.startsWith('ter') ||
    min.includes('term') ||
    min === 'fin' ||
    min.startsWith('fin') ||
    min === 'ft' ||
    min === 'fm' ||
    min === 'ap' ||
    min === 'tab' ||
    per.includes('termin') ||
    per.includes('fin');

  // Doit comporter un score officiel cohérent
  const hasValidScore =
    event.score !== undefined &&
    typeof event.score.home === 'number' &&
    typeof event.score.away === 'number' &&
    !isNaN(event.score.home) &&
    !isNaN(event.score.away) &&
    event.score.home >= 0 &&
    event.score.away >= 0;

  return isFinishedStatus && hasValidScore;
}

/**
 * Vérifie si un événement a été officiellement reporté.
 */
export function isEventPostponed(event: SportEvent): boolean {
  if (!event) return false;
  const min = (event.minute || '').toLowerCase();
  const per = (event.period || '').toLowerCase();
  const stat = (event.status || '').toLowerCase();

  return (
    stat === 'postponed' ||
    min === 'rep' ||
    min.startsWith('rep') ||
    min.includes('report') ||
    min.includes('postpon') ||
    per.includes('report')
  );
}

/**
 * Vérifie si un événement a été officiellement annulé.
 */
export function isEventCancelled(event: SportEvent): boolean {
  if (!event) return false;
  const min = (event.minute || '').toLowerCase();
  const per = (event.period || '').toLowerCase();
  const stat = (event.status || '').toLowerCase();

  return (
    stat === 'cancelled' ||
    min === 'ann' ||
    min.startsWith('ann') ||
    min.includes('annul') ||
    min.includes('canc') ||
    per.includes('annul')
  );
}

/**
 * Vérifie si un événement est suspendu ou interrompu.
 */
export function isEventSuspendedOrAbandoned(event: SportEvent): boolean {
  if (!event) return false;
  const min = (event.minute || '').toLowerCase();
  const stat = (event.status || '').toLowerCase();

  return (
    stat === 'suspended' ||
    stat === 'abandoned' ||
    min.startsWith('susp') ||
    min.startsWith('int') ||
    min.includes('interromp') ||
    min.includes('abandon')
  );
}

// =========================================================================
// MOTEURS SPÉCIFIQUES PAR MARCHÉ
// =========================================================================

/**
 * Règle le marché Résultat du match (1X2 / 1N2)
 */
export function settleMatchResult1X2(
  selectionName: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): SelectionOutcome {
  const cleanSel = selectionName.trim();
  const lowerSel = cleanSel.toLowerCase();
  const scoreFormatted = `${homeScore} - ${awayScore}`;

  if (homeScore > awayScore) {
    // Victoire Domicile (1)
    const isHome =
      cleanSel === '1' ||
      lowerSel.includes('1') ||
      lowerSel.includes(homeTeam.toLowerCase()) ||
      homeTeam.toLowerCase().includes(lowerSel);

    return {
      status: isHome ? 'won' : 'lost',
      determined: true,
      resultStr: `Victoire ${homeTeam} (${scoreFormatted})`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  } else if (homeScore === awayScore) {
    // Match Nul (N / X)
    const isDraw =
      cleanSel === 'N' ||
      cleanSel === 'X' ||
      lowerSel === 'n' ||
      lowerSel === 'x' ||
      lowerSel.includes('nul') ||
      lowerSel.includes('draw');

    return {
      status: isDraw ? 'won' : 'lost',
      determined: true,
      resultStr: `Match Nul (${scoreFormatted})`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  } else {
    // Victoire Extérieur (2)
    const isAway =
      cleanSel === '2' ||
      lowerSel.includes('2') ||
      lowerSel.includes(awayTeam.toLowerCase()) ||
      awayTeam.toLowerCase().includes(lowerSel);

    return {
      status: isAway ? 'won' : 'lost',
      determined: true,
      resultStr: `Victoire ${awayTeam} (${scoreFormatted})`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }
}

/**
 * Règle le marché Double Chance (1N, 12, N2)
 */
export function settleDoubleChance(
  selectionName: string,
  homeScore: number,
  awayScore: number
): SelectionOutcome {
  const lowerSel = selectionName.trim().toLowerCase();
  const scoreFormatted = `${homeScore} - ${awayScore}`;

  if (lowerSel.includes('1n') || lowerSel.includes('1x') || lowerSel.includes('1/n')) {
    // Domicile ou Nul
    const won = homeScore >= awayScore;
    return {
      status: won ? 'won' : 'lost',
      determined: true,
      resultStr: `Score : ${scoreFormatted}`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }

  if (lowerSel.includes('12') || lowerSel.includes('1/2')) {
    // Domicile ou Extérieur (pas de nul)
    const won = homeScore !== awayScore;
    return {
      status: won ? 'won' : 'lost',
      determined: true,
      resultStr: `Score : ${scoreFormatted}`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }

  if (lowerSel.includes('n2') || lowerSel.includes('x2') || lowerSel.includes('n/2')) {
    // Nul ou Extérieur
    const won = awayScore >= homeScore;
    return {
      status: won ? 'won' : 'lost',
      determined: true,
      resultStr: `Score : ${scoreFormatted}`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }

  return {
    status: 'pending',
    determined: false,
    resultStr: scoreFormatted,
  };
}

/**
 * Règle le marché Les deux équipes marquent (BTTS)
 */
export function settleBTTS(
  selectionName: string,
  homeScore: number,
  awayScore: number
): SelectionOutcome {
  const lowerSel = selectionName.trim().toLowerCase();
  const bothScored = homeScore > 0 && awayScore > 0;
  const scoreFormatted = `${homeScore} - ${awayScore}`;

  if (lowerSel === 'oui' || lowerSel === 'yes' || lowerSel.includes('oui')) {
    return {
      status: bothScored ? 'won' : 'lost',
      determined: true,
      resultStr: bothScored ? `Oui (${scoreFormatted})` : `Non (${scoreFormatted})`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }

  if (lowerSel === 'non' || lowerSel === 'no' || lowerSel.includes('non')) {
    return {
      status: !bothScored ? 'won' : 'lost',
      determined: true,
      resultStr: bothScored ? `Oui (${scoreFormatted})` : `Non (${scoreFormatted})`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }

  return {
    status: 'pending',
    determined: false,
    resultStr: scoreFormatted,
  };
}

/**
 * Règle le marché Plus / Moins de buts (Over / Under)
 */
export function settleOverUnder(
  selectionName: string,
  marketName: string,
  homeScore: number,
  awayScore: number
): SelectionOutcome {
  const cleanSel = selectionName.trim();
  const lowerSel = cleanSel.toLowerCase();
  const totalGoals = homeScore + awayScore;
  const scoreFormatted = `${homeScore} - ${awayScore}`;

  // Détection du seuil (ex: 0.5, 1.5, 2.5, 3.5, etc.)
  const matchThreshold = (marketName + ' ' + cleanSel).match(/(\d+[.,]\d+)/);
  const threshold = matchThreshold ? parseFloat(matchThreshold[1].replace(',', '.')) : 2.5;

  const isOver = lowerSel.includes('plus') || cleanSel.startsWith('+') || lowerSel.includes('over');
  const isUnder = lowerSel.includes('moins') || cleanSel.startsWith('-') || lowerSel.includes('under');

  if (isOver) {
    const won = totalGoals > threshold;
    return {
      status: won ? 'won' : 'lost',
      determined: true,
      resultStr: `${totalGoals} buts au total (${scoreFormatted})`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }

  if (isUnder) {
    const won = totalGoals < threshold;
    return {
      status: won ? 'won' : 'lost',
      determined: true,
      resultStr: `${totalGoals} buts au total (${scoreFormatted})`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }

  return {
    status: 'pending',
    determined: false,
    resultStr: scoreFormatted,
  };
}

/**
 * Analyse le résultat officiel d'un événement pour déterminer le statut d'une sélection.
 * Ne pas inventer de données : si données manquantes, reste 'pending'.
 */
export function evaluateSelectionOutcome(
  marketType: MarketCategory | string | undefined,
  marketName: string,
  selectionName: string,
  homeTeam: string,
  awayTeam: string,
  score: { home: number; away: number; detail?: string }
): SelectionOutcome {
  const homeScore = score.home;
  const awayScore = score.away;
  const cleanMkt = (marketName || '').toLowerCase();

  // 1. Résultat du match (1X2)
  if (
    marketType === 'result' ||
    cleanMkt.includes('1n2') ||
    cleanMkt.includes('1x2') ||
    cleanMkt.includes('résultat') ||
    cleanMkt.includes('vainqueur')
  ) {
    return settleMatchResult1X2(selectionName, homeTeam, awayTeam, homeScore, awayScore);
  }

  // 2. Double Chance
  if (marketType === 'double_chance' || cleanMkt.includes('double chance')) {
    return settleDoubleChance(selectionName, homeScore, awayScore);
  }

  // 3. Les deux équipes marquent (BTTS)
  if (marketType === 'btts' || cleanMkt.includes('marquent') || cleanMkt.includes('btts')) {
    return settleBTTS(selectionName, homeScore, awayScore);
  }

  // 4. Totaux / Plus Moins
  if (
    marketType === 'goals' ||
    cleanMkt.includes('plus / moins') ||
    cleanMkt.includes('buts') ||
    cleanMkt.includes('over') ||
    cleanMkt.includes('under')
  ) {
    return settleOverUnder(selectionName, marketName, homeScore, awayScore);
  }

  // Fallback universel (sports collectifs/individuels avec vainqueur Domicile ou Extérieur)
  if (homeScore > awayScore) {
    const isHome = selectionName === '1' || normalizeName(selectionName).includes(normalizeName(homeTeam));
    return {
      status: isHome ? 'won' : 'lost',
      determined: true,
      resultStr: `${homeScore} - ${awayScore}`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  } else if (awayScore > homeScore) {
    const isAway = selectionName === '2' || normalizeName(selectionName).includes(normalizeName(awayTeam));
    return {
      status: isAway ? 'won' : 'lost',
      determined: true,
      resultStr: `${homeScore} - ${awayScore}`,
      finalScoreHome: homeScore,
      finalScoreAway: awayScore,
    };
  }

  return {
    status: 'pending',
    determined: false,
    resultStr: `${homeScore} - ${awayScore}`,
  };
}

/**
 * Recherche robuste de l'événement correspondant à une sélection
 */
export function findMatchingEvent(
  sel: { eventId: string; homeTeam?: string; awayTeam?: string; eventName?: string },
  eventsMap: Map<string, SportEvent>,
  allEvents: SportEvent[]
): SportEvent | undefined {
  // 1. Correspondance directe d'ID
  if (eventsMap.has(sel.eventId)) {
    return eventsMap.get(sel.eventId);
  }

  // 2. Correspondance avec / sans préfixe "med-"
  const cleanId = sel.eventId.replace(/^med-/, '');
  for (const e of allEvents) {
    if (e.id === cleanId || e.id === `med-${cleanId}` || e.id.endsWith(cleanId)) {
      return e;
    }
  }

  // 3. Correspondance par équipes
  const homeTarget = normalizeName(sel.homeTeam || (sel.eventName?.split(' vs ')[0] ?? ''));
  const awayTarget = normalizeName(sel.awayTeam || (sel.eventName?.split(' vs ')[1] ?? ''));

  if (homeTarget && awayTarget) {
    for (const e of allEvents) {
      const eHome = normalizeName(e.homeTeam);
      const eAway = normalizeName(e.awayTeam);
      if (
        (eHome.includes(homeTarget) || homeTarget.includes(eHome)) &&
        (eAway.includes(awayTarget) || awayTarget.includes(eAway))
      ) {
        return e;
      }
    }
  }

  return undefined;
}

// =========================================================================
// MOTEUR D'EXÉCUTION DU RÈGLEMENT ATOMIQUE ET IDEMPOTENT
// =========================================================================

export function runAutomatedSettlement(
  knownEvents: SportEvent[]
): {
  settledBetsCount: number;
  settledCouponsCount: number;
  totalCreditedAmount: number;
  details: string[];
} {
  const eventsMap = new Map<string, SportEvent>();
  for (const e of knownEvents) {
    eventsMap.set(e.id, e);
  }

  const allBets = loadBets();
  const allCoupons = loadCoupons();
  const allUsers = loadUsers();
  const allTransactions = loadTransactions();

  const userMap = new Map<string, User>();
  for (const u of allUsers) {
    userMap.set(u.id, { ...u });
  }

  let settledBetsCount = 0;
  let settledCouponsCount = 0;
  let totalCreditedAmount = 0;
  const details: string[] = [];
  let usersModified = false;
  let transactionsModified = false;
  let betsModified = false;
  let couponsModified = false;

  const nowIso = new Date().toISOString();

  // =====================================================
  // 1. RÈGLEMENT DES COUPONS COMBINÉS & SIMPLES (COUPONS)
  // =====================================================
  for (let i = 0; i < allCoupons.length; i++) {
    const coupon = allCoupons[i];

    // Protection Idempotence : Ne jamais re-régler un coupon déjà définitivement réglé
    if (coupon.settlementStatus === 'settled' || coupon.settlementStatus === 'refunded') {
      continue;
    }

    let hasPendingLeg = false;
    let hasLostLeg = false;
    let legsChanged = false;

    // Évaluer chaque sélection du coupon
    for (const sel of coupon.selections) {
      // Si la sélection a déjà un statut final fixé
      if (sel.status === 'lost') {
        hasLostLeg = true;
        continue;
      }
      if (sel.status === 'won' || sel.status === 'cancelled' || sel.status === 'void') {
        continue;
      }

      // Rechercher l'événement réel correspondant
      const event = findMatchingEvent(
        {
          eventId: sel.eventId,
          homeTeam: sel.homeTeam,
          awayTeam: sel.awayTeam,
          eventName: sel.eventName,
        },
        eventsMap,
        knownEvents
      );

      // Cas A : Aucun événement trouvé ou match pas encore commencé/en direct -> attendre
      if (!event) {
        hasPendingLeg = true;
        continue;
      }

      // Si logos disponibles sur l'événement, les attacher à la sélection si manquants
      if (!sel.homeTeamLogo && event.teams?.home?.logo) {
        sel.homeTeamLogo = event.teams.home.logo;
        legsChanged = true;
      }
      if (!sel.awayTeamLogo && event.teams?.away?.logo) {
        sel.awayTeamLogo = event.teams.away.logo;
        legsChanged = true;
      }

      // Cas B : Match reporté (POSTPONED)
      // Règle 21 : Conserver le pari ouvert, ne pas régler en gagné/perdu, attendre la nouvelle date
      if (isEventPostponed(event)) {
        sel.status = 'pending';
        sel.selectionStatus = 'pending';
        sel.officialResult = 'Match reporté (en attente de reprogrammation)';
        hasPendingLeg = true;
        legsChanged = true;
        continue;
      }

      // Cas C : Match suspendu ou abandonné (SUSPENDED / ABANDONED)
      // Règle 23 : Conserver PENDING, attendre décision officielle
      if (isEventSuspendedOrAbandoned(event)) {
        sel.status = 'pending';
        sel.selectionStatus = 'pending';
        sel.officialResult = 'Match suspendu (en attente de décision officielle)';
        hasPendingLeg = true;
        legsChanged = true;
        continue;
      }

      // Cas D : Match officiellement annulé (CANCELLED)
      // Règle 22 : Marquer la sélection comme VOID (cote 1.00)
      if (isEventCancelled(event)) {
        sel.status = 'cancelled';
        sel.selectionStatus = 'void';
        sel.settlementStatus = 'refunded';
        sel.officialResult = 'Match officiellement annulé (Sélection neutralisée)';
        sel.settledAt = nowIso;
        legsChanged = true;
        continue;
      }

      // Cas E : Match non terminé
      if (!isEventConfirmedFinished(event)) {
        hasPendingLeg = true;
        continue;
      }

      // Cas F : Match terminé avec score officiel confirmé
      const outcome = evaluateSelectionOutcome(
        sel.marketType,
        sel.marketName,
        sel.selectionName,
        event.homeTeam,
        event.awayTeam,
        event.score!
      );

      if (!outcome.determined) {
        hasPendingLeg = true;
        continue;
      }

      sel.finalScoreHome = event.score!.home;
      sel.finalScoreAway = event.score!.away;
      sel.settledAt = nowIso;
      sel.resultStatus = 'confirmed';
      sel.officialResult = outcome.resultStr;

      if (outcome.status === 'won') {
        sel.status = 'won';
        sel.selectionStatus = 'won';
      } else if (outcome.status === 'lost') {
        sel.status = 'lost';
        sel.selectionStatus = 'lost';
        hasLostLeg = true;
      } else if (outcome.status === 'void') {
        sel.status = 'cancelled';
        sel.selectionStatus = 'void';
      }

      legsChanged = true;
    }

    if (legsChanged) {
      couponsModified = true;
    }

    // Identifiants uniques de règlement pour idempotence
    const winSettlementId = `SETTLE-WIN-COUPON-${coupon.id}`;
    const refundSettlementId = `SETTLE-REFUND-COUPON-${coupon.id}`;

    // RÈGLE 11 COMBINÉ :
    // 1. Si au moins UNE sélection est LOST -> COUPON PERDU immédiatement
    if (hasLostLeg) {
      coupon.status = 'lost';
      coupon.settlementStatus = 'settled';
      coupon.settlementId = `SETTLE-LOST-COUPON-${coupon.id}`;
      coupon.settledAt = nowIso;
      coupon.actualPayout = 0;
      coupon.officialResultSummary = 'Au moins une sélection perdante';

      settledCouponsCount++;
      couponsModified = true;
      details.push(`Coupon #${coupon.id} PERDU (0 FCFA)`);
      continue;
    }

    // 2. Si aucune sélection perdante et encore des sélections PENDING -> COUPON EN ATTENTE
    if (hasPendingLeg) {
      coupon.status = 'pending';
      coupon.settlementStatus = 'pending';
      continue;
    }

    // 3. Toutes les sélections sont terminées (soit won, soit void/cancelled)
    const wonLegs = coupon.selections.filter(s => s.status === 'won');
    const voidLegs = coupon.selections.filter(s => s.status === 'cancelled' || s.status === 'void');

    // Cas 3A : Toutes les sélections sont VOID / ANNULÉES -> Remboursement intégral de la mise
    if (voidLegs.length === coupon.selections.length) {
      const alreadyRefunded = allTransactions.some(
        t => t.id === refundSettlementId || (t.couponId === coupon.id && t.type === 'BET_REFUND')
      );

      coupon.status = 'cancelled';
      coupon.settlementStatus = 'refunded';
      coupon.settlementId = refundSettlementId;
      coupon.settledAt = nowIso;
      coupon.actualPayout = coupon.amount;
      coupon.officialResultSummary = 'Toutes les sélections ont été annulées (Mise remboursée)';

      const refundAmount = Number(coupon.amount.toFixed(2));
      const targetUser = userMap.get(coupon.userId);

      if (targetUser && !alreadyRefunded) {
        const balBefore = targetUser.balance;
        const balAfter = Number((balBefore + refundAmount).toFixed(2));
        targetUser.balance = balAfter;
        usersModified = true;

        const tx: BalanceTransaction = {
          id: refundSettlementId,
          userId: targetUser.id,
          amount: refundAmount,
          type: 'BET_REFUND',
          timestamp: nowIso,
          adminResponsible: 'Système FLASH (Remboursement Annulation)',
          balanceBefore: balBefore,
          balanceAfter: balAfter,
          notes: `Remboursement de la mise (${Math.round(refundAmount).toLocaleString('fr-FR')} FCFA) pour le coupon #${coupon.id} suite à l'annulation des matchs`,
          couponId: coupon.id,
        };

        allTransactions.unshift(tx);
        transactionsModified = true;
        totalCreditedAmount += refundAmount;
        details.push(`Coupon #${coupon.id} ANNULÉ (+${Math.round(refundAmount).toLocaleString('fr-FR')} FCFA remboursés à ${targetUser.name})`);
      }

      settledCouponsCount++;
      couponsModified = true;
      continue;
    }

    // Cas 3B : Toutes les sélections actives sont GAGNÉES (avec neutralisation des sélections annulées à 1.00)
    const alreadyWonPaid = allTransactions.some(
      t => t.id === winSettlementId || (t.couponId === coupon.id && t.type === 'BET_WIN_PAYOUT')
    );

    // Recalcul de la cote combinée : produit des sélections gagnées (cote 1.00 pour les void)
    const finalOdds = Number(
      wonLegs.reduce((acc, s) => acc * (s.oddsAtPlacement || s.odds), 1).toFixed(2)
    );
    const payout = Number((coupon.amount * finalOdds).toFixed(2));

    coupon.status = 'won';
    coupon.settlementStatus = 'settled';
    coupon.settlementId = winSettlementId;
    coupon.settledAt = nowIso;
    coupon.totalOdds = finalOdds;
    coupon.actualPayout = payout;
    coupon.officialResultSummary =
      voidLegs.length > 0
        ? `Gagné avec cote ajustée à ${finalOdds.toFixed(2)} (${voidLegs.length} sélection(s) neutralisée(s))`
        : 'Toutes les sélections validées gagnantes';

    const targetUser = userMap.get(coupon.userId);

    // CRÉDIT DU COMPTE : UNE SEULE FOIS (Règle 17 & 18)
    if (targetUser && !alreadyWonPaid) {
      const balBefore = targetUser.balance;
      const balAfter = Number((balBefore + payout).toFixed(2));
      targetUser.balance = balAfter;
      usersModified = true;

      const tx: BalanceTransaction = {
        id: winSettlementId,
        userId: targetUser.id,
        amount: payout,
        type: 'BET_WIN_PAYOUT',
        timestamp: nowIso,
        adminResponsible: 'Système FLASH (Gain Validé)',
        balanceBefore: balBefore,
        balanceAfter: balAfter,
        notes: `Paiement des gains pour le coupon #${coupon.id} (${wonLegs.length} sélection(s) gagnante(s) @ cote ${finalOdds.toFixed(2)})`,
        couponId: coupon.id,
      };

      allTransactions.unshift(tx);
      transactionsModified = true;
      totalCreditedAmount += payout;
      details.push(`Coupon #${coupon.id} GAGNÉ (+${Math.round(payout).toLocaleString('fr-FR')} FCFA crédités à ${targetUser.name})`);
    }

    settledCouponsCount++;
    couponsModified = true;
  }

  // =====================================================
  // 2. RÈGLEMENT DES PARIS SIMPLES INDIVIDUELS (BETS)
  // =====================================================
  for (let i = 0; i < allBets.length; i++) {
    const bet = allBets[i];

    if (bet.settlementStatus === 'settled' || bet.settlementStatus === 'refunded') {
      continue;
    }

    const event = findMatchingEvent(
      {
        eventId: bet.eventId,
        homeTeam: bet.homeTeam,
        awayTeam: bet.awayTeam,
        eventName: bet.eventName,
      },
      eventsMap,
      knownEvents
    );

    if (!event) continue;

    // Si le pari est lié à un coupon, synchroniser avec le statut du coupon
    if (bet.couponId) {
      const parentCoupon = allCoupons.find(c => c.id === bet.couponId);
      if (parentCoupon) {
        const correspondingLeg = parentCoupon.selections.find(s => s.id === bet.id || s.eventId === bet.eventId);
        if (correspondingLeg && correspondingLeg.status !== 'pending') {
          bet.status = correspondingLeg.status;
          bet.settlementStatus = parentCoupon.settlementStatus;
          bet.settledAt = correspondingLeg.settledAt;
          bet.officialResult = correspondingLeg.officialResult;
          bet.finalScoreHome = correspondingLeg.finalScoreHome;
          bet.finalScoreAway = correspondingLeg.finalScoreAway;
          settledBetsCount++;
          betsModified = true;
          continue;
        }
      }
    }

    // Gestion match reporté
    if (isEventPostponed(event)) {
      bet.officialResult = 'Match reporté (en attente)';
      continue;
    }

    // Gestion match annulé
    if (isEventCancelled(event)) {
      const refundId = `SETTLE-REFUND-BET-${bet.id}`;
      const alreadyRefunded = allTransactions.some(t => t.id === refundId);

      bet.status = 'cancelled';
      bet.settlementStatus = 'refunded';
      bet.settlementId = refundId;
      bet.officialResult = 'Match annulé (Remboursement intégral)';
      bet.settledAt = nowIso;

      const refundAmount = Number(bet.amount.toFixed(2));
      const targetUser = userMap.get(bet.userId);

      if (targetUser && !alreadyRefunded && refundAmount > 0) {
        const balBefore = targetUser.balance;
        const balAfter = Number((balBefore + refundAmount).toFixed(2));
        targetUser.balance = balAfter;
        usersModified = true;

        const tx: BalanceTransaction = {
          id: refundId,
          userId: targetUser.id,
          amount: refundAmount,
          type: 'BET_REFUND',
          timestamp: nowIso,
          adminResponsible: 'Système FLASH (Remboursement Pari Simple)',
          balanceBefore: balBefore,
          balanceAfter: balAfter,
          notes: `Remboursement du pari simple #${bet.id} suite à annulation`,
          betId: bet.id,
        };

        allTransactions.unshift(tx);
        transactionsModified = true;
        totalCreditedAmount += refundAmount;
      }

      settledBetsCount++;
      betsModified = true;
      continue;
    }

    if (!isEventConfirmedFinished(event)) continue;

    const outcome = evaluateSelectionOutcome(
      bet.marketType,
      bet.marketName,
      bet.selectionName,
      event.homeTeam,
      event.awayTeam,
      event.score!
    );

    if (!outcome.determined) continue;

    bet.finalScoreHome = event.score!.home;
    bet.finalScoreAway = event.score!.away;
    bet.officialResult = outcome.resultStr;
    bet.settledAt = nowIso;
    bet.resultStatus = 'confirmed';

    const winBetId = `SETTLE-WIN-BET-${bet.id}`;
    const alreadyWonPaid = allTransactions.some(t => t.id === winBetId);

    if (outcome.status === 'won') {
      bet.status = 'won';
      bet.settlementStatus = 'settled';
      bet.settlementId = winBetId;
      bet.actualPayout = bet.potentialPayout;

      const payout = Number(bet.potentialPayout.toFixed(2));
      const targetUser = userMap.get(bet.userId);

      if (targetUser && !alreadyWonPaid && payout > 0) {
        const balBefore = targetUser.balance;
        const balAfter = Number((balBefore + payout).toFixed(2));
        targetUser.balance = balAfter;
        usersModified = true;

        const tx: BalanceTransaction = {
          id: winBetId,
          userId: targetUser.id,
          amount: payout,
          type: 'BET_WIN_PAYOUT',
          timestamp: nowIso,
          adminResponsible: 'Système FLASH (Gain Pari Simple)',
          balanceBefore: balBefore,
          balanceAfter: balAfter,
          notes: `Gain pour le pari simple #${bet.id}`,
          betId: bet.id,
        };

        allTransactions.unshift(tx);
        transactionsModified = true;
        totalCreditedAmount += payout;
      }
    } else {
      bet.status = 'lost';
      bet.settlementStatus = 'settled';
      bet.settlementId = `SETTLE-LOST-BET-${bet.id}`;
      bet.actualPayout = 0;
    }

    settledBetsCount++;
    betsModified = true;
  }

  // Sauvegarde atomique de toutes les modifications
  if (couponsModified) saveCoupons(allCoupons);
  if (betsModified) saveBets(allBets);

  if (usersModified) {
    const updatedUsersList = Array.from(userMap.values());
    saveUsers(updatedUsersList);

    const current = getCurrentUser();
    if (current && userMap.has(current.id)) {
      setCurrentUser(userMap.get(current.id)!);
    }
  }

  if (transactionsModified) saveTransactions(allTransactions);

  return {
    settledBetsCount,
    settledCouponsCount,
    totalCreditedAmount,
    details,
  };
}

// =========================================================================
// STOCKAGE & PLACEMENT SÉCURISÉ DES COUPONS
// =========================================================================
const COUPONS_KEY = 'flash_coupons_v1';

export function loadCoupons(userId?: string): Coupon[] {
  try {
    const raw = localStorage.getItem(COUPONS_KEY);
    const list: Coupon[] = raw ? JSON.parse(raw) : [];

    // Rétrocompatibilité : Enrichir les sélections anciennes avec displaySelection et marketSnapshot si absents
    for (const coupon of list) {
      for (const sel of coupon.selections) {
        if (!sel.displaySelection) {
          sel.displaySelection = formatSelectionDisplay(
            sel.marketType,
            sel.marketName,
            sel.selectionName,
            sel.homeTeam || sel.eventName?.split(' vs ')[0] || '',
            sel.awayTeam || sel.eventName?.split(' vs ')[1] || ''
          );
        }
        if (!sel.homeTeam && sel.eventName) {
          const parts = sel.eventName.split(' vs ');
          sel.homeTeam = parts[0]?.trim() || '';
          sel.awayTeam = parts[1]?.trim() || '';
        }
        if (!sel.oddsAtPlacement && sel.odds) {
          sel.oddsAtPlacement = sel.odds;
        }
      }
    }

    if (userId) {
      return list.filter(c => c.userId === userId);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveCoupons(coupons: Coupon[]): void {
  localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
}

/**
 * Place un coupon (simple ou combiné), débite atomiquement le solde utilisateur,
 * et enregistre la transaction BET_STAKE_DEBIT dans le journal comptable.
 */
export function placeUserCoupon(
  user: User,
  couponData: Omit<Coupon, 'id' | 'createdAt' | 'status' | 'settlementStatus' | 'settlementId'>
): { success: boolean; error?: string; coupon?: Coupon; updatedUser?: User } {
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex === -1) {
    return { success: false, error: 'Compte utilisateur non trouvé.' };
  }

  const currentUser = users[userIndex];
  if (currentUser.balance < couponData.amount) {
    return {
      success: false,
      error: `Solde disponible insuffisant (${Math.round(currentUser.balance).toLocaleString('fr-FR')} FCFA). Mise demandée : ${Math.round(couponData.amount).toLocaleString('fr-FR')} FCFA.`,
    };
  }

  // 1. Débiter le solde atomiquement
  const balanceBefore = currentUser.balance;
  currentUser.balance = Number((balanceBefore - couponData.amount).toFixed(2));
  users[userIndex] = currentUser;
  saveUsers(users);
  setCurrentUser(currentUser);

  // 2. Générer l'identifiant unique du coupon
  const couponId = `FLASH-C-${Math.floor(10000 + Math.random() * 90000)}`;
  const nowIso = new Date().toISOString();

  // 3. Enregistrer immédiatement la transaction de débit dans le grand livre (Règle 16)
  const debitTransaction: BalanceTransaction = {
    id: `TX-DEBIT-${couponId}`,
    userId: currentUser.id,
    amount: couponData.amount,
    type: 'BET_STAKE_DEBIT',
    timestamp: nowIso,
    adminResponsible: 'Système FLASH (Prise de Pari)',
    balanceBefore,
    balanceAfter: currentUser.balance,
    notes: `Mise engagée pour le coupon ${couponData.type === 'combined' ? 'combiné' : 'simple'} #${couponId} (${couponData.selections.length} sélection(s))`,
    couponId,
  };

  const allTransactions = loadTransactions();
  allTransactions.unshift(debitTransaction);
  saveTransactions(allTransactions);

  // 4. Créer le coupon avec toutes les informations immuables requises (Règle 1, 2, 3)
  const enrichedSelections: CouponSelection[] = couponData.selections.map((sel, idx) => {
    const displaySelection =
      sel.displaySelection ||
      formatSelectionDisplay(
        sel.marketType,
        sel.marketName,
        sel.selectionName,
        sel.homeTeam,
        sel.awayTeam
      );

    const snapshot: MarketSnapshot = sel.marketSnapshot || {
      marketId: sel.marketId || `mkt-${idx}`,
      marketName: sel.marketName,
      marketType: sel.marketType || 'result',
      selectionId: sel.selectionId,
      selectionName: sel.selectionName,
      displaySelection,
      odds: sel.oddsAtPlacement || sel.odds,
    };

    return {
      ...sel,
      couponId,
      betId: sel.id || `SEL-${Date.now()}-${idx}`,
      displaySelection,
      marketSnapshot: snapshot,
      oddsAtPlacement: sel.oddsAtPlacement || sel.odds,
      odds: sel.oddsAtPlacement || sel.odds,
      selectionStatus: 'pending',
      status: 'pending',
      resultStatus: 'pending',
      settlementStatus: 'pending',
      source: 'https://www.matchendirect.fr/',
      createdAt: nowIso,
    };
  });

  const newCoupon: Coupon = {
    ...couponData,
    id: couponId,
    selections: enrichedSelections,
    initialTotalOdds: couponData.totalOdds,
    status: 'pending',
    settlementStatus: 'pending',
    createdAt: nowIso,
  };

  const allCoupons = loadCoupons();
  allCoupons.unshift(newCoupon);
  saveCoupons(allCoupons);

  // 5. Enregistrer les sélections individuelles dans les paris
  const allBets = loadBets();
  for (const sel of enrichedSelections) {
    const bet: Bet = {
      id: sel.id,
      userId: currentUser.id,
      eventId: sel.eventId,
      eventName: sel.eventName || `${sel.homeTeam} vs ${sel.awayTeam}`,
      homeTeam: sel.homeTeam,
      awayTeam: sel.awayTeam,
      homeTeamLogo: sel.homeTeamLogo,
      awayTeamLogo: sel.awayTeamLogo,
      sport: sel.sport,
      competition: sel.competition,
      marketName: sel.marketName,
      marketType: sel.marketType,
      marketSnapshot: sel.marketSnapshot,
      selectionId: sel.selectionId,
      selectionName: sel.selectionName,
      displaySelection: sel.displaySelection,
      oddsAtPlacement: sel.oddsAtPlacement,
      odds: sel.odds,
      amount: newCoupon.type === 'simple' ? newCoupon.amount : 0,
      potentialPayout: newCoupon.type === 'simple' ? newCoupon.potentialPayout : 0,
      status: 'pending',
      settlementStatus: 'pending',
      couponId: couponId,
      createdAt: newCoupon.createdAt,
    };
    allBets.unshift(bet);
  }
  saveBets(allBets);

  return { success: true, coupon: newCoupon, updatedUser: currentUser };
}
