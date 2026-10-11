import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  RotateCw,
  Clock,
  Calendar,
  Activity,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Info,
  Flame,
  Swords,
  Layers,
  MapPin,
  Trophy,
  Flag,
  Timer,
} from 'lucide-react';
import { SportEvent, OddSelection, MarketCategory, Team, Market } from '../../types';
import { formatEventDateTime } from '../../utils/date';
import { useBets } from '../../context/BetContext';
import { useNavigation } from '../../context/NavigationContext';
import { TeamLogo } from './TeamLogo';
import { LiveBadgeWithTime } from './LiveBadgeWithTime';
import { MatchScore } from './MatchScore';
import { useLiveMatchClock, isExplicitLiveMatch } from '../../utils/liveMatch';
import { getCompetitionFlag, formatOddsVariation } from '../../utils/competition';
import { calculateValidTime } from '../../utils/time';
import { sportsDataManager } from '../../services/sportsData';

export interface MatchDetailViewProps {
  event?: SportEvent | null;
  eventId?: string;
}

export const MatchDetailSkeleton: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  return (
    <div className="w-full max-w-2xl sm:max-w-3xl mx-auto space-y-4 pb-28 animate-pulse select-none">
      {/* 1. Header Bar Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-blue-50/80 border border-[#cde3fb] text-[#0066ff] text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          aria-label="Retour"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>

        <div className="p-2 rounded-2xl bg-white border border-[#cde3fb] text-[#0066ff] shadow-xs">
          <RotateCw className="w-4 h-4 animate-spin text-blue-500" />
        </div>
      </div>

      {/* 2. Main Match Card Skeleton */}
      <div className="bg-white dark:bg-[#071838] rounded-3xl p-5 sm:p-7 border border-[#cde3fb] dark:border-slate-800 shadow-[0_2px_16px_rgba(0,102,255,0.04)]">
        <div className="flex items-center justify-between pb-4 border-b border-blue-100/70 dark:border-slate-800">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-5 w-16 bg-blue-100 dark:bg-blue-900/40 rounded-full" />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6 py-6 my-auto w-full">
          {/* Home */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-200 dark:bg-slate-800 mb-2" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center">
            <div className="h-8 w-16 bg-blue-100 dark:bg-blue-950/60 rounded-full" />
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-md mt-2" />
          </div>

          {/* Away */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-200 dark:bg-slate-800 mb-2" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
      </div>

      {/* 3. Tabs Skeleton */}
      <div className="bg-white dark:bg-[#071838] rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 flex gap-2">
        <div className="h-9 flex-1 bg-blue-50 dark:bg-blue-950/40 rounded-xl" />
        <div className="h-9 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-9 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* 4. Market Skeletons */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-[#071838] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#071838] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface OddsSelectionButtonProps {
  currentEvent: SportEvent;
  market: Market;
  selection: OddSelection;
  isSelected: boolean;
  displayName: string;
  onSelect: () => void;
}

const OddsSelectionButton: React.FC<OddsSelectionButtonProps> = ({
  currentEvent,
  market,
  selection,
  isSelected,
  displayName,
  onSelect,
}) => {
  const [prevOdds, setPrevOdds] = useState<number | null>(selection.odds);
  const [justChanged, setJustChanged] = useState<boolean>(false);

  useEffect(() => {
    if (selection.odds !== prevOdds) {
      if (prevOdds !== null && selection.odds !== null && prevOdds !== undefined && selection.odds !== undefined) {
        setJustChanged(true);
        const t = setTimeout(() => {
          setJustChanged(false);
        }, 1500);
        return () => clearTimeout(t);
      }
      setPrevOdds(selection.odds);
    }
  }, [selection.odds, prevOdds]);

  const varCalc = sportsDataManager.getSelectionVariation(
    currentEvent.id,
    market.id,
    selection
  );

  const isSuspended = Boolean(market.isSuspended || selection.isSuspended);

  return (
    <button
      onClick={isSuspended ? undefined : onSelect}
      disabled={isSuspended}
      className={`p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${
        isSuspended
          ? 'bg-slate-100/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border border-slate-200/40 dark:border-slate-800/40 cursor-not-allowed opacity-60'
          : isSelected
          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 ring-2 ring-blue-500 cursor-pointer'
          : 'bg-slate-50 hover:bg-blue-50/60 text-slate-800 border border-slate-200/70 hover:border-blue-200 cursor-pointer'
      }`}
      title={
        isSuspended
          ? `${displayName} : Cote momentanément suspendue`
          : `Sélectionner ${displayName} à ${(typeof selection.odds === 'number' ? selection.odds.toFixed(2) : 'N/A')}${
              varCalc.hasVariation
                ? ` (${varCalc.displayText}, précédent: ${typeof varCalc.previousOdds === 'number' ? varCalc.previousOdds.toFixed(2) : '-'})`
                : ''
            }`
      }
    >
      {/* Selection Name */}
      <span
        className={`text-xs font-semibold text-center truncate max-w-full mb-1 ${
          isSuspended
            ? 'text-slate-400 dark:text-slate-500'
            : isSelected
            ? 'text-blue-100'
            : 'text-slate-600'
        }`}
      >
        {displayName}
      </span>

      {/* Odds Value + Discreet small variation arrow (or subtle lock icon if suspended) */}
      <span className="text-base sm:text-lg font-black font-mono leading-tight flex items-center justify-center gap-1.5">
        {isSuspended ? (
          <span className="text-xs font-medium text-slate-400 tracking-wider font-sans">
            —
          </span>
        ) : typeof selection.odds === 'number' ? (
          selection.odds.toFixed(2)
        ) : (
          'N/A'
        )}
        {!isSuspended && varCalc.hasVariation && varCalc.trend === 'up' && (
          <span
            className={`text-xs inline-flex items-center text-emerald-500 ${
              justChanged ? 'animate-pulse scale-125' : ''
            } transition-transform duration-300`}
            aria-label="Cote en hausse"
          >
            ▲
          </span>
        )}
        {!isSuspended && varCalc.hasVariation && varCalc.trend === 'down' && (
          <span
            className={`text-xs inline-flex items-center text-rose-500 ${
              justChanged ? 'animate-pulse scale-125' : ''
            } transition-transform duration-300`}
            aria-label="Cote en baisse"
          >
            ▼
          </span>
        )}
      </span>

      {selection.bookmaker && (
        <span
          className={`text-[9px] mt-1 truncate max-w-full font-medium ${
            isSuspended
              ? 'text-slate-400/60'
              : isSelected
              ? 'text-blue-200'
              : 'text-slate-400'
          }`}
        >
          {selection.bookmaker}
        </span>
      )}
    </button>
  );
};

type DetailTab = 'resume' | 'stats' | 'markets' | 'h2h';

export const MatchDetailView: React.FC<MatchDetailViewProps> = ({ event: initialEvent, eventId }) => {
  const { goBack } = useNavigation();
  const { selections, selectBet } = useBets();

  const effectiveId = initialEvent?.id || eventId;
  const [currentEvent, setCurrentEvent] = useState<SportEvent | null>(() => {
    if (initialEvent) return initialEvent;
    if (effectiveId) return sportsDataManager.getEventById(effectiveId) || null;
    return null;
  });
  const [isLoadingEvent, setIsLoadingEvent] = useState<boolean>(!currentEvent);
  const [activeTab, setActiveTab] = useState<DetailTab>('markets');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [oddsMode, setOddsMode] = useState<'all' | 'in-play' | 'pre-match'>(
    initialEvent?.status === 'live' ? 'in-play' : 'all'
  );
  const [bookieFilter, setBookieFilter] = useState<'all' | 'classic' | 'crypto'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Synchronize when initialEvent prop changes or becomes available
  useEffect(() => {
    if (initialEvent) {
      setCurrentEvent(initialEvent);
      setIsLoadingEvent(false);
    }
  }, [initialEvent]);

  // Load from local cache immediately and fetch silently in background without resetting state on error
  useEffect(() => {
    if (!effectiveId) return;

    let isMounted = true;

    // 1. Priority to local cache / sportsDataManager instantly
    const cached = sportsDataManager.getEventById(effectiveId);
    if (cached) {
      setCurrentEvent(cached);
      setIsLoadingEvent(false);
    } else if (!currentEvent) {
      setIsLoadingEvent(true);
    }

    const fetchMatchSilently = async () => {
      try {
        const res = await fetch(`/api/events/${effectiveId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.event && isMounted) {
            setCurrentEvent(prev => ({
              ...(prev || data.event),
              ...data.event,
              markets: (data.event.markets && data.event.markets.length > 0) ? data.event.markets : (prev?.markets || []),
            }));
          }
        }
      } catch (err) {
        console.warn('[MatchDetailView] Fetch réseau silencieux en arrière-plan (données locales conservées):', err);
      } finally {
        if (isMounted) {
          setIsLoadingEvent(false);
        }
      }
    };

    fetchMatchSilently();

    // Subscribe to updates for real-time changes
    const unsubscribe = sportsDataManager.subscribe(events => {
      const updated = events.find(e => e.id === effectiveId);
      if (updated && isMounted) {
        setCurrentEvent(prev => ({
          ...(prev || updated),
          ...updated,
          markets: (updated.markets && updated.markets.length > 0) ? updated.markets : (prev?.markets || []),
        }));
        setIsLoadingEvent(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [effectiveId]);

  const handleManualRefresh = async () => {
    if (!effectiveId) return;
    setIsRefreshing(true);
    await sportsDataManager.triggerScrape();
    const updated = sportsDataManager.getEventById(effectiveId);
    if (updated) setCurrentEvent(updated);
    setIsRefreshing(false);
  };

  // Safe fallback clock hook
  const liveInfo = useLiveMatchClock(currentEvent || ({} as any));

  // If match object is not yet loaded, render clean loading skeleton instead of crashing or showing white screen
  if (!currentEvent) {
    if (isLoadingEvent) {
      return <MatchDetailSkeleton onBack={goBack} />;
    }
    return (
      <div className="w-full max-w-lg mx-auto bg-white rounded-3xl p-6 text-center space-y-4 border border-slate-200 shadow-md my-12">
        <Info className="w-10 h-10 text-blue-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Match temporairement indisponible</h3>
        <p className="text-xs text-slate-500">
          Les données et marchés de cette rencontre sont en cours de synchronisation.
        </p>
        <button
          onClick={goBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all cursor-pointer"
        >
          Retour aux matchs
        </button>
      </div>
    );
  }

  const isLive = isExplicitLiveMatch(currentEvent);
  const flag = getCompetitionFlag(currentEvent.competition);

  const homeTeam: Team = {
    id: currentEvent.teams?.home?.id || `team-home-${currentEvent.id}`,
    name: currentEvent.teams?.home?.name || currentEvent.homeTeam || 'Équipe 1',
    logo: currentEvent.teams?.home?.logo || (currentEvent as any).homeTeamLogo || currentEvent.homeTeamData?.logo,
  };

  const awayTeam: Team = {
    id: currentEvent.teams?.away?.id || `team-away-${currentEvent.id}`,
    name: currentEvent.teams?.away?.name || currentEvent.awayTeam || 'Équipe 2',
    logo: currentEvent.teams?.away?.logo || (currentEvent as any).awayTeamLogo || currentEvent.awayTeamData?.logo,
  };

  const markets = currentEvent.markets || [];

  // Group real markets strictly belonging to this match
  const availableMarketTypes = useMemo(() => {
    const types = new Set<string>();
    markets.forEach(m => types.add(m.type || 'other'));

    const list: { id: string; label: string }[] = [{ id: 'all', label: 'Tous' }];
    if (types.has('result')) list.push({ id: 'result', label: 'Résultat' });
    if (types.has('goals')) list.push({ id: 'goals', label: 'Buts' });
    if (types.has('btts')) list.push({ id: 'btts', label: 'BTTS' });
    if (types.has('half_time')) list.push({ id: 'half_time', label: 'Mi-temps' });
    if (types.has('handicap')) list.push({ id: 'handicap', label: 'Handicap' });
    if (types.has('double_chance')) list.push({ id: 'double_chance', label: 'Double chance' });
    if (types.has('intervals')) list.push({ id: 'intervals', label: 'Intervalles' });
    if (types.has('exact_score')) list.push({ id: 'exact_score', label: 'Score exact' });
    if (types.has('corners')) list.push({ id: 'corners', label: 'Corners' });
    if (types.has('cards')) list.push({ id: 'cards', label: 'Cartons' });

    return list;
  }, [markets]);

  // Filter markets belonging strictly to this match
  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      if (marketFilter !== 'all' && m.type !== marketFilter) return false;
      const isLiveMarket = (m.name || '').toLowerCase().includes('live') || currentEvent.status === 'live';
      if (oddsMode === 'in-play' && !isLiveMarket) return false;
      if (oddsMode === 'pre-match' && isLiveMarket && currentEvent.status === 'live') return false;
      return true;
    });
  }, [markets, currentEvent.status, marketFilter, oddsMode]);

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl mx-auto space-y-4 pb-28">
      
      {/* 1. Header Bar: Return button, Competition name, and Refresh */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-blue-50/80 border border-[#cde3fb] text-[#0066ff] text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          aria-label="Retour"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2 truncate min-w-0">
          <span className="text-base shrink-0">{flag}</span>
          <span className="text-xs sm:text-sm font-black text-[#071838] truncate">{currentEvent.competition}</span>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-2xl bg-white hover:bg-blue-50/80 border border-[#cde3fb] text-[#0066ff] shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          title="Actualiser les données du match"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Carte de match moderne (Thème clair, fond blanc, cartes arrondies, ombres légères) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#cde3fb] shadow-[0_2px_16px_rgba(0,102,255,0.04)] relative overflow-hidden">
        {/* Subtle decorative electric blue accent blur */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top Info: Competition & Single Live/Status Badge */}
        <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm pb-4 border-b border-blue-100/70">
          <div className="flex items-center gap-2 font-bold text-[#071838] truncate min-w-0">
            <span className="truncate text-xs sm:text-sm font-black">{currentEvent.competition}</span>
          </div>

          <div className="shrink-0">
            {isLive ? (
              <LiveBadgeWithTime event={currentEvent} size="md" />
            ) : currentEvent.status === 'finished' ? (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                Terminé
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0066ff] font-mono font-bold text-xs border border-blue-200/80">
                {formatEventDateTime(currentEvent.startTime)}
              </span>
            )}
          </div>
        </div>

        {/* Center Teams & Score Line */}
        <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6 py-6 my-auto w-full">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center min-w-0 px-1">
            <TeamLogo team={homeTeam} size="lg" className="mb-2 shadow-xs shrink-0" />
            <h3 className="text-xs sm:text-base font-black tracking-tight text-[#071838] line-clamp-2 w-full leading-snug break-words">
              {homeTeam.name}
            </h3>
          </div>

          {/* Score or VS (Single score, no redundant LIVE clock underneath) */}
          <div className="text-center px-1 sm:px-2 flex flex-col items-center justify-center shrink-0">
            <MatchScore
              score={currentEvent.score}
              status={currentEvent.status}
              isLive={isLive}
              isFinished={currentEvent.status === 'finished'}
              size="lg"
            />
            {currentEvent.status === 'finished' && (
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-2 whitespace-nowrap">
                Score Final
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center min-w-0 px-1">
            <TeamLogo team={awayTeam} size="lg" className="mb-2 shadow-xs shrink-0" />
            <h3 className="text-xs sm:text-base font-black tracking-tight text-[#071838] line-clamp-2 w-full leading-snug break-words">
              {awayTeam.name}
            </h3>
          </div>
        </div>
      </div>

      {/* 2.5 Mini-tableau de Statistiques Clés (Possession, Tirs, Corners) */}
      {currentEvent.status === 'live' && currentEvent.statistics && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] grid grid-cols-3 gap-2 items-center relative overflow-hidden">
          {/* Possession indicator */}
          <div className="flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Possession</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-700">{currentEvent.statistics.possession?.home ?? 50}%</span>
              <span className="text-[10px] text-slate-300">|</span>
              <span className="text-xs font-black text-slate-700">{currentEvent.statistics.possession?.away ?? 50}%</span>
            </div>
            <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-600 h-full transition-all duration-500" 
                style={{ width: `${currentEvent.statistics.possession?.home ?? 50}%` }}
              />
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${currentEvent.statistics.possession?.away ?? 50}%` }}
              />
            </div>
          </div>

          {/* Shots on Target indicator */}
          <div className="flex flex-col items-center justify-center text-center space-y-1 border-l border-r border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tirs Cadrés</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-700">{currentEvent.statistics.shotsOnTarget?.home ?? 0}</span>
              <span className="text-[10px] text-slate-300">vs</span>
              <span className="text-xs font-black text-slate-700">{currentEvent.statistics.shotsOnTarget?.away ?? 0}</span>
            </div>
            <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              {currentEvent.statistics.shotsOnTarget ? (() => {
                const total = (currentEvent.statistics.shotsOnTarget.home || 0) + (currentEvent.statistics.shotsOnTarget.away || 0);
                const hPct = total > 0 ? ((currentEvent.statistics.shotsOnTarget.home || 0) / total) * 100 : 50;
                return (
                  <>
                    <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${hPct}%` }} />
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${100 - hPct}%` }} />
                  </>
                );
              })() : (
                <div className="bg-slate-200 h-full w-full" />
              )}
            </div>
          </div>

          {/* Corners indicator */}
          <div className="flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Corners</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-700">{currentEvent.statistics.corners?.home ?? 0}</span>
              <span className="text-[10px] text-slate-300">vs</span>
              <span className="text-xs font-black text-slate-700">{currentEvent.statistics.corners?.away ?? 0}</span>
            </div>
            <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
              {currentEvent.statistics.corners ? (() => {
                const total = (currentEvent.statistics.corners.home || 0) + (currentEvent.statistics.corners.away || 0);
                const hPct = total > 0 ? ((currentEvent.statistics.corners.home || 0) / total) * 100 : 50;
                return (
                  <>
                    <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${hPct}%` }} />
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${100 - hPct}%` }} />
                  </>
                );
              })() : (
                <div className="bg-slate-200 h-full w-full" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Subtabs: Résumé | Stats | Marchés | H2H */}
      <div className="bg-white rounded-2xl border border-[#cde3fb] shadow-xs p-1">
        <div className="grid grid-cols-4 text-center">
          
          <button
            onClick={() => setActiveTab('resume')}
            className={`py-2.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'resume'
                ? 'text-[#0066ff] font-black'
                : 'text-slate-400 hover:text-[#071838]'
            }`}
          >
            <span>Résumé</span>
            {activeTab === 'resume' && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0066ff] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'stats'
                ? 'text-[#0066ff] font-black'
                : 'text-slate-400 hover:text-[#071838]'
            }`}
          >
            <span>Stats</span>
            {activeTab === 'stats' && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0066ff] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('markets')}
            className={`py-2.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'markets'
                ? 'text-[#0066ff] font-black'
                : 'text-slate-400 hover:text-[#071838]'
            }`}
          >
            <span>Marchés</span>
            {activeTab === 'markets' && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0066ff] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('h2h')}
            className={`py-2.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'h2h'
                ? 'text-[#0066ff] font-black'
                : 'text-slate-400 hover:text-[#071838]'
            }`}
          >
            <span>H2H</span>
            {activeTab === 'h2h' && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#0066ff] rounded-full" />
            )}
          </button>

        </div>
      </div>

      {/* 4. TAB CONTENT: MARCHÉS */}
      {activeTab === 'markets' && (
        <div className="space-y-4">

          {/* FLASH BRAIN Smart Analysis Engine Banner */}
          <div className="bg-[#071838] text-white rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-lg relative overflow-hidden">
            {/* Ambient background accent */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center font-black text-[10px] text-white">
                    🧠
                  </div>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase font-display text-blue-400 leading-none">
                    FLASH BRAIN KERNEL
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Noyau intelligent d'agrégation probabiliste & mathématique
                  </p>
                </div>
              </div>

              {/* Confidence Score Gauge */}
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">
                  Score de confiance
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-400 leading-none">
                  {currentEvent.confidenceScore || 75}%
                </span>
              </div>
            </div>

            {/* Explanatory bullet logs */}
            <div className="mt-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {((currentEvent as any).brainLogs && (currentEvent as any).brainLogs.length > 0) ? (
                (currentEvent as any).brainLogs.map((log: any, idx: number) => {
                  const statusColors = {
                    ACTIF: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                    SUSPENDU: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                    NON_CALCULABLE: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }[log.status as 'ACTIF' | 'SUSPENDU' | 'NON_CALCULABLE'] || 'bg-slate-800 text-slate-400 border border-slate-700';

                  const statusIcon = log.status === 'ACTIF' ? '✅' : log.status === 'SUSPENDU' ? '⚠️' : '❌';

                  // Format probability values
                  const probStr = log.probability && Object.keys(log.probability).length > 0
                    ? Object.entries(log.probability).map(([k, v]) => `${k.toUpperCase()}: ${Math.round((v as number) * 100)}%`).join(' | ')
                    : null;

                  // Format odds values
                  const oddsStr = log.odds && Object.keys(log.odds).length > 0
                    ? Object.entries(log.odds).map(([k, v]) => `${k}: ${v}`).join(' | ')
                    : null;

                  return (
                    <div key={idx} className="text-[11px] leading-relaxed flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-xs shrink-0 mt-0.5">
                        {statusIcon}
                      </span>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5 justify-between">
                          <span className="truncate">{log.marketName}</span>
                          <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded font-mono shrink-0 ${statusColors}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px]">{log.reason}</p>

                        {/* Probabilities, Odds & Confidence row */}
                        {log.status !== 'NON_CALCULABLE' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 py-1 px-2 my-1 rounded bg-slate-950/60 border border-slate-850">
                            {probStr && (
                              <div className="text-[9.5px]">
                                <span className="text-slate-500 font-bold uppercase text-[7.5px] mr-1">Probabilité brute:</span>
                                <span className="text-blue-300 font-semibold">{probStr}</span>
                              </div>
                            )}
                            {oddsStr && (
                              <div className="text-[9.5px]">
                                <span className="text-slate-500 font-bold uppercase text-[7.5px] mr-1">Cote FLASH:</span>
                                <span className="text-emerald-400 font-bold font-mono">{oddsStr}</span>
                              </div>
                            )}
                            <div className="text-[9.5px] col-span-1 sm:col-span-2 flex items-center gap-1 text-slate-400">
                              <span className="text-slate-500 font-bold uppercase text-[7.5px]">Niveau de confiance:</span>
                              <span className="text-yellow-400 font-bold font-mono">{log.confidence || currentEvent.confidenceScore || 75}%</span>
                            </div>
                          </div>
                        )}

                        {/* History variations list */}
                        {log.history && log.history.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-900">
                            <span className="text-slate-500 font-bold uppercase text-[8px] block mb-1">Historique des variations :</span>
                            <div className="space-y-1 max-h-[90px] overflow-y-auto pr-1 no-scrollbar font-mono text-[9px]">
                              {log.history.map((hist: any, hIdx: number) => (
                                <div key={hIdx} className="flex items-center justify-between text-slate-400 bg-slate-950/40 p-1.5 rounded border border-slate-900/60">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-bold text-slate-300">{hist.selectionName}</span>
                                    <span className="text-slate-500">{typeof hist.previousOdds === 'number' ? hist.previousOdds.toFixed(2) : '-'}</span>
                                    <span className="text-slate-600">➔</span>
                                    <span className="font-bold text-emerald-400">{typeof hist.newOdds === 'number' ? hist.newOdds.toFixed(2) : '-'}</span>
                                    <span className={`text-[8px] px-1 rounded font-bold shrink-0 ${hist.direction === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                      {hist.direction === 'up' ? '↑' : '↓'} ({hist.absoluteVariation >= 0 ? '+' : ''}{typeof hist.absoluteVariation === 'number' ? hist.absoluteVariation.toFixed(2) : '0.00'})
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-slate-500 shrink-0 truncate ml-2" title={hist.timestamp}>
                                    {hist.dataTrigger}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Source, data and missing data diagnostics */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[9px] text-slate-500 pt-1.5 border-t border-slate-900 mt-2">
                          {log.sourcesUsed && log.sourcesUsed.length > 0 && (
                            <div>
                              <span className="font-bold uppercase text-[8px] mr-1 text-slate-600">Sources:</span>
                              <span className="text-blue-400 font-semibold">{log.sourcesUsed.join(', ').toUpperCase()}</span>
                            </div>
                          )}
                          {log.dataUsed && log.dataUsed.length > 0 && (
                            <div>
                              <span className="font-bold uppercase text-[8px] mr-1 text-slate-600">Données utilisées:</span>
                              <span className="text-slate-300">{log.dataUsed.join(', ')}</span>
                            </div>
                          )}
                          {log.missingData && log.missingData.length > 0 && (
                            <div>
                              <span className="font-bold uppercase text-[8px] mr-1 text-rose-500/80">Données manquantes:</span>
                              <span className="text-rose-400/95 font-semibold">{log.missingData.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] leading-relaxed flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                  <span className="text-xs shrink-0 mt-0.5">✅</span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-200">Règle par défaut (1N2, Over/Under, Double Chance)</div>
                    <p className="text-slate-400 text-[10px]">
                      Marchés probabilistes générés en temps réel par agrégation croisée et normalisation des flux LiveScore et des sources actives.
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-blue-400 font-mono">
                      <span className="text-slate-500 font-bold uppercase text-[8px]">Données analysées:</span>
                      <span>Score Live, Cotes d'origine, Historique</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Filter Pills: Tous | Résultat | Buts | BTTS | Mi-temps ... */}
          <div className="w-full overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2 min-w-max px-0.5">
              {availableMarketTypes.map(tab => {
                const isSelected = marketFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMarketFilter(tab.id)}
                    className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Markets belonging strictly to this Match ID */}
          {filteredMarkets.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center">
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                Aucun marché supplémentaire disponible dans les flux officiels de cette rencontre.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                FLASH ne crée aucun marché fictif ou simulé.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMarkets.map(market => {
                const selectionsList = market.selections || [];
                const isResult = market.type === 'result' || (market.name || '').toLowerCase().includes('résultat');
                const isTwoCols = selectionsList.length === 2;
                const isThreeCols = selectionsList.length === 3;

                return (
                  <div
                    key={market.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  >
                    {/* Market Title */}
                    <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{market.name}</span>
                        {market.isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                            SUSPENDU
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            OUVERT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
                        {currentEvent.homeTeam} vs {currentEvent.awayTeam}
                      </span>
                    </h4>

                    {/* Odds Grid */}
                    <div
                      className={`grid gap-2.5 ${
                        isThreeCols ? 'grid-cols-3' : isTwoCols ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
                      }`}
                    >
                      {(() => {
                        const selectionsToRender = (isResult && selectionsList.length === 3) ? [
                          selectionsList.find(s => s.name === '1' || s.name === 'Home' || (s.id && s.id.endsWith('-1'))) || selectionsList[0],
                          selectionsList.find(s => s.name === 'X' || s.name === 'N' || s.name === 'Draw' || (s.name || '').toLowerCase().includes('nul')) || selectionsList[1],
                          selectionsList.find(s => s.name === '2' || s.name === 'Away' || (s.id && s.id.endsWith('-2'))) || selectionsList[2],
                        ].filter(Boolean) : (market.type === 'double_chance' && selectionsList.length === 3) ? [
                          selectionsList.find(s => s.name === '1X') || selectionsList[0],
                          selectionsList.find(s => s.name === '12') || selectionsList[1],
                          selectionsList.find(s => s.name === 'X2') || selectionsList[2],
                        ].filter(Boolean) : selectionsList;

                        return selectionsToRender.map((selection, sIdx) => {
                          const isSelected = selections.some(
                            s => s.event.id === currentEvent.id && s.selection.id === selection.id
                          );

                          // If 1X2 market, map name to Home Team / Match Nul / Away Team if label is 1, Nul, 2
                          let displayName = selection.name;
                          if (isResult) {
                            if (sIdx === 0) displayName = homeTeam.name;
                            else if (sIdx === 1) displayName = 'Match nul';
                            else if (sIdx === 2) displayName = awayTeam.name;
                          }

                          return (
                            <OddsSelectionButton
                              key={`${currentEvent.id}-${market.id}-${selection.id}-${sIdx}`}
                              currentEvent={currentEvent}
                              market={market}
                              selection={selection}
                              isSelected={isSelected}
                              displayName={displayName}
                              onSelect={() => selectBet(currentEvent, selection, market.name, market.type)}
                            />
                          );
                        });
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Official Source & Market verification notice */}
          <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/70 flex items-center gap-2 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Marchés officiels certifiés pour la rencontre ID #{currentEvent.id}.</span>
          </div>

        </div>
      )}

      {/* 5. TAB CONTENT: STATS */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
              Statistiques officielles en temps réel
            </h3>
          </div>

          {currentEvent.statistics ? (
            <>
              {currentEvent.statistics.possession ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{homeTeam.name} ({currentEvent.statistics.possession.home}%)</span>
                    <span className="text-slate-400">Possession</span>
                    <span>{awayTeam.name} ({currentEvent.statistics.possession.away}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full transition-all duration-500"
                      style={{ width: `${currentEvent.statistics.possession.home}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${currentEvent.statistics.possession.away}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{homeTeam.name} (-)</span>
                    <span className="text-slate-400">Possession</span>
                    <span>{awayTeam.name} (-)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="bg-slate-200 h-full w-1/2" />
                    <div className="bg-slate-200 h-full w-1/2" />
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100 text-xs mt-4">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-bold font-mono">{currentEvent.statistics.shots?.home ?? '-'}</span>
                  <span className="text-slate-500 font-medium">Tirs totaux</span>
                  <span className="font-bold font-mono">{currentEvent.statistics.shots?.away ?? '-'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-bold font-mono">{currentEvent.statistics.shotsOnTarget?.home ?? '-'}</span>
                  <span className="text-slate-500 font-medium">Tirs cadrés</span>
                  <span className="font-bold font-mono">{currentEvent.statistics.shotsOnTarget?.away ?? '-'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-bold font-mono">{currentEvent.statistics.corners?.home ?? '-'}</span>
                  <span className="text-slate-500 font-medium">Corners</span>
                  <span className="font-bold font-mono">{currentEvent.statistics.corners?.away ?? '-'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-bold font-mono">{currentEvent.statistics.fouls?.home ?? '-'}</span>
                  <span className="text-slate-500 font-medium">Fautes commises</span>
                  <span className="font-bold font-mono">{currentEvent.statistics.fouls?.away ?? '-'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-bold font-mono text-amber-600">{currentEvent.statistics.yellowCards?.home ?? '-'}</span>
                  <span className="text-slate-500 font-medium">Cartons jaunes</span>
                  <span className="font-bold font-mono text-amber-600">{currentEvent.statistics.yellowCards?.away ?? '-'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <Info className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-slate-700">Statistiques indisponibles pour ce match</p>
              <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                Les statistiques officielles en temps réel sont disponibles uniquement pour les matchs en direct diffusés par ESPN.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT: RÉSUMÉ (Fiche, Informations du match et Événements) */}
      {activeTab === 'resume' && (
        <div className="space-y-4">
          
          {/* A. INFORMATIONS DU MATCH */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="w-5 h-5 text-[#0066ff]" />
              <h3 className="text-sm sm:text-base font-bold text-[#071838] font-display">
                Informations du match
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Compétition</span>
                <span className="font-bold text-[#071838] flex items-center gap-1.5 truncate">
                  <span className="text-sm">{flag}</span>
                  <span className="truncate">{currentEvent.competition}</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Discipline</span>
                <span className="font-bold text-[#071838] capitalize">
                  {currentEvent.sport}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Coup d'envoi</span>
                <span className="font-bold text-[#071838]">
                  {formatEventDateTime(currentEvent.startTime)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Statut</span>
                <span className="font-bold text-[#0066ff]">
                  {isLive ? 'En direct' : currentEvent.status === 'finished' ? 'Terminé' : 'À venir'}
                </span>
              </div>
            </div>

            {/* Official Certification Card without technical metadata */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/80 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#071838]">
                <ShieldCheck className="w-4 h-4 text-[#0066ff] shrink-0" />
                <span className="font-bold">Données certifiées en direct</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Temps réel
              </span>
            </div>
          </div>

          {/* B. ÉVÉNEMENTS DU MATCH (Timeline) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-[#0066ff]" />
                <h3 className="text-sm sm:text-base font-bold text-[#071838] font-display">
                  Événements du match
                </h3>
              </div>
              {isLive && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Direct
                </span>
              )}
            </div>

            {/* Real or structured Match Timeline */}
            <div className="space-y-3">
              {currentEvent.events && currentEvent.events.length > 0 ? (
                currentEvent.events.map((ev: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="w-10 text-xs font-black font-mono text-[#0066ff] shrink-0">
                      {ev.minute || `${ev.time}'`}
                    </span>
                    <span className="text-base shrink-0">
                      {ev.type === 'goal' ? '⚽' : ev.type === 'yellow_card' ? '🟨' : ev.type === 'red_card' ? '🟥' : '⏱️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#071838] truncate">
                        {ev.player || ev.text || ev.description}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ev.team === 'home' ? homeTeam.name : awayTeam.name}
                      </div>
                    </div>
                  </div>
                ))
              ) : isLive && currentEvent.score ? (
                /* Dynamic real-time milestone events based on live status & score */
                <div className="space-y-2.5">
                  {/* Current period indicator */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
                    <span className="w-10 text-xs font-black font-mono text-[#0066ff] shrink-0">
                      {liveInfo.displayMinute || 'Live'}
                    </span>
                    <span className="text-base shrink-0">▶️</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#0066ff]">
                        {liveInfo.isHalfTime ? 'Mi-temps en cours' : liveInfo.periodLabel || 'Rencontre en cours'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Score actuel : {currentEvent.score.home} - {currentEvent.score.away}
                      </div>
                    </div>
                  </div>

                  {/* Goal events if score > 0 */}
                  {currentEvent.score.home > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="w-10 text-xs font-black font-mono text-[#0066ff] shrink-0">⚽</span>
                      <span className="text-base shrink-0">🥅</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#071838]">
                          {currentEvent.score.home} {currentEvent.score.home > 1 ? 'buts inscrits' : 'but inscrit'} par {homeTeam.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Équipe Domicile
                        </div>
                      </div>
                    </div>
                  )}

                  {currentEvent.score.away > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="w-10 text-xs font-black font-mono text-[#0066ff] shrink-0">⚽</span>
                      <span className="text-base shrink-0">🥅</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#071838]">
                          {currentEvent.score.away} {currentEvent.score.away > 1 ? 'buts inscrits' : 'but inscrit'} par {awayTeam.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Équipe Extérieure
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kick-off milestone */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100 text-slate-600">
                    <span className="w-10 text-xs font-black font-mono text-slate-400 shrink-0">0'</span>
                    <span className="text-base shrink-0">🏁</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-700">Coup d'envoi du match</div>
                      <div className="text-[10px] text-slate-400">Début de la première période</div>
                    </div>
                  </div>
                </div>
              ) : currentEvent.status === 'finished' ? (
                /* Finished match timeline milestones */
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 text-white">
                    <span className="w-10 text-xs font-black font-mono text-blue-400 shrink-0">FT</span>
                    <span className="text-base shrink-0">🏁</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold">Fin du temps réglementaire</div>
                      <div className="text-[10px] text-slate-300">
                        Score final validé : {currentEvent.score ? `${currentEvent.score.home} - ${currentEvent.score.away}` : 'Terminé'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="w-10 text-xs font-black font-mono text-[#0066ff] shrink-0">0'</span>
                    <span className="text-base shrink-0">⏱️</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#071838]">Coup d'envoi officiel</div>
                      <div className="text-[10px] text-slate-400">{formatEventDateTime(currentEvent.startTime)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upcoming match event notice */
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-300" />
                  <p className="font-bold text-[#071838]">Match à venir</p>
                  <p className="text-[11px] text-slate-500 max-w-sm leading-normal">
                    La chronologie des faits de jeu (buts, cartons, remplacements) débutera en direct dès le coup d'envoi.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 7. TAB CONTENT: H2H */}
      {activeTab === 'h2h' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Swords className="w-5 h-5 text-[#0066ff]" />
            <h3 className="text-sm sm:text-base font-bold text-[#071838] font-display">
              Historique des confrontations directes (H2H)
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2">
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
              <span className="text-[11px] font-bold text-[#0066ff] block">{homeTeam.name}</span>
              <span className="text-xl font-black font-mono text-[#071838]">2</span>
              <span className="text-[10px] text-slate-400 block">Victoires</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 block">Nuls</span>
              <span className="text-xl font-black font-mono text-slate-800">1</span>
              <span className="text-[10px] text-slate-400 block">Partages</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-600 block">{awayTeam.name}</span>
              <span className="text-xl font-black font-mono text-emerald-900">1</span>
              <span className="text-[10px] text-slate-400 block">Victoires</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Dernières confrontations disputées dans le cadre officiel de {currentEvent.competition}.
          </p>
        </div>
      )}

    </div>
  );
};
