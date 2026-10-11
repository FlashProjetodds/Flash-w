import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Bet, Coupon, CouponSelection, OddSelection, SportEvent, MarketCategory, MarketSnapshot } from '../types';
import { loadBets } from '../services/storage';
import { loadCoupons, placeUserCoupon, runAutomatedSettlement } from '../services/settlementEngine';
import { sportsDataManager } from '../services/sportsData';
import { formatSelectionDisplay } from '../utils/selectionDisplay';
import { useAuth } from './AuthContext';

export interface BetTicketItem {
  event: SportEvent;
  selection: OddSelection;
  marketName: string;
  marketType?: MarketCategory;
  displaySelection: string;
  marketId?: string;
  isSuspended?: boolean;
  previousOdds?: number;
  variation?: string | number;
  trend?: 'up' | 'down' | 'stable';
  suspensionReason?: string;
}

export interface SettlementToast {
  type: 'win' | 'lost' | 'refund' | 'info';
  title: string;
  message: string;
  amount?: number;
}

interface BetContextType {
  // Coupon selections
  selections: BetTicketItem[];
  slipMode: 'simple' | 'combined';
  setSlipMode: (mode: 'simple' | 'combined') => void;
  stake: number;
  setStake: (val: number) => void;
  totalOdds: number;
  potentialPayout: number;
  hasSuspendedSelections: boolean;

  // Actions on selections
  selectBet: (event: SportEvent, selection: OddSelection, marketName: string, marketType?: MarketCategory) => void;
  removeSelection: (selectionId: string, eventId?: string, marketName?: string) => void;
  clearSlip: () => void;
  submitCoupon: () => Promise<{ success: boolean; error?: string; coupon?: Coupon }>;

  // History & Settlement
  myBets: Bet[];
  myCoupons: Coupon[];
  refreshBetsAndCoupons: () => void;
  triggerSettlementCheck: () => void;

  // UI state & Notifications
  isSlipOpen: boolean;
  setIsSlipOpen: (open: boolean) => void;
  isSettling: boolean;
  settlementToast: SettlementToast | null;
  dismissToast: () => void;
  
  // New UI/Prefs
  acceptAllOdds: boolean;
  setAcceptAllOdds: (val: boolean) => void;
  placingBet: boolean;
  countdown: number;
}

const BetContext = createContext<BetContextType | undefined>(undefined);

export const BetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [selections, setSelections] = useState<BetTicketItem[]>([]);
  const [slipMode, setSlipMode] = useState<'simple' | 'combined'>('combined');
  const [stake, setStake] = useState<number>(10);
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState<boolean>(false);
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [settlementToast, setSettlementToast] = useState<SettlementToast | null>(null);

  const dismissToast = useCallback(() => {
    setSettlementToast(null);
  }, []);

  // Compute combined odds and potential payout
  const totalOdds = selections.length === 0
    ? 1
    : Number(selections.reduce((acc, item) => acc * (typeof item.selection.odds === 'number' && !isNaN(item.selection.odds) ? item.selection.odds : 1), 1).toFixed(2));

  const potentialPayout = Number((stake * totalOdds).toFixed(2));

  // Vérifie si au moins une cote du coupon est suspendue
  const hasSuspendedSelections = selections.some(
    item => Boolean(item.isSuspended || item.selection.isSuspended)
  );

  const refreshBetsAndCoupons = useCallback(() => {
    if (user?.id) {
      const userBets = loadBets(user.id);
      const userCoupons = loadCoupons(user.id);
      setMyBets(prev => (JSON.stringify(prev) === JSON.stringify(userBets) ? prev : userBets));
      setMyCoupons(prev => (JSON.stringify(prev) === JSON.stringify(userCoupons) ? prev : userCoupons));
    } else {
      setMyBets(prev => (prev.length === 0 ? prev : []));
      setMyCoupons(prev => (prev.length === 0 ? prev : []));
    }
  }, [user?.id]);

  // Automated background settlement check
  const triggerSettlementCheck = useCallback(() => {
    const allKnownEvents = sportsDataManager.getAllKnownEvents();
    if (allKnownEvents.length > 0) {
      const result = runAutomatedSettlement(allKnownEvents);
      if (result.settledBetsCount > 0 || result.settledCouponsCount > 0) {
        refreshBetsAndCoupons();
        refreshUser();

        // Afficher une notification claire de règlement
        if (result.totalCreditedAmount > 0) {
          setSettlementToast({
            type: 'win',
            title: 'Règlement validé · Solde crédité',
            message: `${result.details[0] || 'Gains crédités en direct sur votre compte !'}`,
            amount: result.totalCreditedAmount,
          });
        } else if (result.details.length > 0) {
          setSettlementToast({
            type: 'info',
            title: 'Résultats officiels confirmés',
            message: result.details[0],
          });
        }
      }
    }
  }, [refreshBetsAndCoupons, refreshUser]);

  useEffect(() => {
    refreshBetsAndCoupons();
  }, [refreshBetsAndCoupons]);

  // Clear all sensitive betting data upon logout or session invalidation
  useEffect(() => {
    if (!user) {
      setSelections([]);
      setIsSlipOpen(false);
      setSettlementToast(null);
      setMyBets([]);
      setMyCoupons([]);
    }
  }, [user]);

  useEffect(() => {
    const handleLogout = () => {
      setSelections([]);
      setIsSlipOpen(false);
      setSettlementToast(null);
      setMyBets([]);
      setMyCoupons([]);
    };
    window.addEventListener('flash:logout', handleLogout);
    return () => window.removeEventListener('flash:logout', handleLogout);
  }, []);

  // Keep a stable ref to the settlement trigger callback
  const triggerSettlementRef = useRef(triggerSettlementCheck);
  useEffect(() => {
    triggerSettlementRef.current = triggerSettlementCheck;
  }, [triggerSettlementCheck]);

  // Synchronisation dynamique du Coupon de Pari en temps réel via le flux SSE
  const syncSelectionsWithLiveEvents = useCallback((liveEvents: SportEvent[]) => {
    if (!liveEvents || liveEvents.length === 0) return;

    setSelections(prev => {
      if (prev.length === 0) return prev;

      let changed = false;
      const next = prev.map(item => {
        const liveEvent = liveEvents.find(e => e.id === item.event.id);
        if (!liveEvent) {
          return item;
        }

        const isEventSuspended = liveEvent.status === 'suspended';

        // Trouver le marché correspondant
        const matchingMarket = (liveEvent.markets || []).find(m =>
          (item.marketType && m.type === item.marketType) ||
          m.id === item.marketName ||
          m.name.toLowerCase() === item.marketName.toLowerCase() ||
          (item.marketId && m.id === item.marketId)
        );

        if (!matchingMarket) {
          if (isEventSuspended && !item.isSuspended) {
            changed = true;
            return {
              ...item,
              event: liveEvent,
              isSuspended: true,
              suspensionReason: 'Match suspendu',
            };
          }
          return { ...item, event: liveEvent };
        }

        // Trouver la sélection correspondante
        const matchingSelection = (matchingMarket.selections || []).find(s =>
          s.id === item.selection.id ||
          s.name.trim().toLowerCase() === item.selection.name.trim().toLowerCase()
        );

        if (!matchingSelection) {
          return { ...item, event: liveEvent };
        }

        const isSuspended = Boolean(
          isEventSuspended ||
          matchingMarket.isSuspended ||
          matchingSelection.isSuspended
        );

        const currentOdds = item.selection.odds;
        const newOdds = matchingSelection.odds;

        const oddsChanged =
          typeof newOdds === 'number' &&
          !isNaN(newOdds) &&
          newOdds > 1.0 &&
          Math.abs(newOdds - currentOdds) > 0.001;

        const suspensionChanged = isSuspended !== Boolean(item.isSuspended || item.selection.isSuspended);

        if (oddsChanged || suspensionChanged || liveEvent.status !== item.event.status) {
          changed = true;

          let trend: 'up' | 'down' | 'stable' = matchingSelection.trend || item.selection.trend || 'stable';
          let variation = matchingSelection.variation;
          if (oddsChanged) {
            trend = newOdds > currentOdds ? 'up' : 'down';
            const diff = newOdds - currentOdds;
            variation = `${diff > 0 ? '+' : ''}${diff.toFixed(2)}`;
          }

          const updatedSelection: OddSelection = {
            ...item.selection,
            ...matchingSelection,
            odds: typeof newOdds === 'number' && !isNaN(newOdds) ? newOdds : currentOdds,
            previousOdds: oddsChanged ? currentOdds : (matchingSelection.previousOdds || item.selection.previousOdds),
            isSuspended,
            trend,
            variation,
          };

          return {
            ...item,
            event: liveEvent,
            selection: updatedSelection,
            marketId: matchingMarket.id,
            isSuspended,
            previousOdds: oddsChanged ? currentOdds : item.previousOdds,
            variation,
            trend,
            suspensionReason: isSuspended ? 'Cote suspendue' : undefined,
          };
        }

        return item;
      });

      return changed ? next : prev;
    });
  }, []);

  // Continuously listen to event updates from sportsDataManager for automated settlement & real-time bet slip sync
  useEffect(() => {
    const unsub = sportsDataManager.subscribe(liveEvents => {
      triggerSettlementRef.current();
      syncSelectionsWithLiveEvents(liveEvents);
    });

    const timer = setInterval(() => {
      triggerSettlementRef.current();
    }, 15000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [syncSelectionsWithLiveEvents]);

  // Selection handlers: allow unlimited combinations across all matches and sports (Requires Auth)
  const selectBet = (
    event: SportEvent,
    selection: OddSelection,
    marketName: string,
    marketType?: MarketCategory
  ) => {
    if (!user) {
      // Unauthenticated: odds selection and betting are strictly protected
      return;
    }

    const displaySelection = formatSelectionDisplay(
      marketType,
      marketName,
      selection.name,
      event.homeTeam,
      event.awayTeam
    );

    setSelections(prev => {
      // 1. Check if this exact selection is already present -> toggle off
      const existsIndex = prev.findIndex(
        item => item.selection.id === selection.id && item.event.id === event.id && item.marketName === marketName
      );
      if (existsIndex >= 0) {
        const next = [...prev];
        next.splice(existsIndex, 1);
        if (next.length === 0) setIsSlipOpen(false);
        return next;
      }

      // 2. Check if a selection for the SAME market of the SAME match already exists -> replace choice for that specific market
      const sameMarketIndex = prev.findIndex(
        item =>
          item.event.id === event.id &&
          (item.marketName === marketName || (item.marketType && marketType && item.marketType === marketType))
      );
      if (sameMarketIndex >= 0) {
        const next = [...prev];
        next[sameMarketIndex] = { event, selection, marketName, marketType, displaySelection };
        return next;
      }

      // 3. Otherwise, add as a new leg (unlimited combinations across any match and any sport)
      const next = [...prev, { event, selection, marketName, marketType, displaySelection }];
      // If 2 or more selections, automatically default to combined coupon mode
      if (next.length >= 2) setSlipMode('combined');
      return next;
    });

    // Ne pas ouvrir automatiquement le coupon en grand : l'utilisateur touche l'icône de coupon quand il a fini
  };

  const removeSelection = (selectionId: string, eventId?: string, marketName?: string) => {
    setSelections(prev => {
      const next = prev.filter(item => {
        if (eventId && marketName) {
          return !(item.selection.id === selectionId && item.event.id === eventId && item.marketName === marketName);
        }
        if (eventId) {
          return !(item.selection.id === selectionId && item.event.id === eventId);
        }
        return item.selection.id !== selectionId;
      });
      if (next.length === 0) setIsSlipOpen(false);
      return next;
    });
  };

  const clearSlip = () => {
    setSelections([]);
    setIsSlipOpen(false);
  };

  // UI & Odds Preferences
  const [acceptAllOdds, setAcceptAllOdds] = useState<boolean>(true);
  const [placingBet, setPlacingBet] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  // ... (keep existing state/effects)

  // Submit Coupon (Records all combinations into a single coupon)
  const submitCoupon = async (): Promise<{ success: boolean; error?: string; coupon?: Coupon }> => {
    if (!user) {
      return { success: false, error: 'Veuillez vous connecter pour valider un coupon de pari.' };
    }

    if (selections.length === 0) {
      return { success: false, error: 'Aucune sélection dans votre coupon de pari.' };
    }

    if (stake <= 0 || isNaN(stake)) {
      return { success: false, error: 'Veuillez renseigner une mise valide supérieure à 0.' };
    }

    if (user.balance < stake) {
      return {
        success: false,
        error: `Solde insuffisant (${Math.round(user.balance).toLocaleString('fr-FR')} FCFA).`,
      };
    }

    // Bloquer la validation si une ou plusieurs cotes sont suspendues
    if (hasSuspendedSelections) {
      return {
        success: false,
        error: 'Cote suspendue : une ou plusieurs sélections de votre coupon sont actuellement suspendues.',
      };
    }

    // 3. Validation Countdown
    setPlacingBet(true);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(0);
    setPlacingBet(false);

    // Multiple selections form a combined ticket saved in a single coupon
    const isCombined = selections.length > 1;
    const nowIso = new Date().toISOString();
    const ticketId = `#FL-${Math.floor(10000 + Math.random() * 90000)}`;

    const couponSelections: CouponSelection[] = selections.map((item, idx) => {
      const displaySelection =
        item.displaySelection ||
        formatSelectionDisplay(
          item.marketType,
          item.marketName,
          item.selection.name,
          item.event.homeTeam,
          item.event.awayTeam
        );

      const marketSnapshot: MarketSnapshot = {
        marketId: item.marketType || 'result',
        marketName: item.marketName,
        marketType: item.marketType || 'result',
        selectionId: item.selection.id,
        selectionName: item.selection.name,
        displaySelection,
        odds: item.selection.odds,
      };

      const selId = `SEL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}-${idx}`;
      const startDate = item.event.startTime ? item.event.startTime.split('T')[0] : nowIso.split('T')[0];
      const startHour = item.event.startTime && item.event.startTime.includes('T') ? item.event.startTime.split('T')[1].slice(0, 5) : '';

      return {
        id: selId,
        betId: selId,
        eventId: item.event.id,
        sport: item.event.sport,
        competition: item.event.competition,
        date: startDate,
        heure: startHour,
        homeTeam: item.event.homeTeam,
        awayTeam: item.event.awayTeam,
        homeTeamLogo: item.event.teams?.home?.logo || (item.event as any).homeTeamLogo || item.event.homeTeamData?.logo,
        awayTeamLogo: item.event.teams?.away?.logo || (item.event as any).awayTeamLogo || item.event.awayTeamData?.logo,
        marketId: item.marketType || 'result',
        marketName: item.marketName,
        marketType: item.marketType,
        marketSnapshot,
        selectionId: item.selection.id,
        selectionName: item.selection.name,
        selectedValue: item.selection.name,
        displaySelection,
        oddsAtPlacement: item.selection.odds,
        odds: item.selection.odds,
        stake: isCombined ? stake : stake,
        eventStatusAtPlacement: item.event.status,
        selectionStatus: 'pending',
        status: 'pending',
        resultStatus: 'pending',
        settlementStatus: 'pending',
        source: 'https://www.matchendirect.fr/',
        createdAt: nowIso,
        eventName: `${item.event.homeTeam} vs ${item.event.awayTeam}`,
      };
    });

    const res = placeUserCoupon(user, {
      userId: user.id,
      type: isCombined ? 'combined' : 'simple',
      selections: couponSelections,
      totalOdds,
      amount: stake,
      potentialPayout,
    });

    if (res.success && res.coupon) {
      refreshUser();
      refreshBetsAndCoupons();
      clearSlip();
      setIsSlipOpen(false);
      return { success: true, coupon: res.coupon };
    }

    return { success: false, error: res.error || 'Erreur lors du placement du coupon.' };
  };

  return (
    <BetContext.Provider
      value={{
        selections,
        slipMode,
        setSlipMode,
        stake,
        setStake,
        totalOdds,
        potentialPayout,
        hasSuspendedSelections,
        selectBet,
        removeSelection,
        clearSlip,
        submitCoupon,
        myBets,
        myCoupons,
        refreshBetsAndCoupons,
        triggerSettlementCheck,
        isSlipOpen,
        setIsSlipOpen,
        isSettling,
        settlementToast,
        dismissToast,
        acceptAllOdds,
        setAcceptAllOdds,
        placingBet,
        countdown,
      }}
    >
      {children}
    </BetContext.Provider>
  );
};

export function useBets() {
  const context = useContext(BetContext);
  if (!context) {
    throw new Error('useBets must be used within a BetProvider');
  }
  return context;
}
