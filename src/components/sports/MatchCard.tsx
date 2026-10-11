import React, { useState, useEffect, useRef } from 'react';
import { SportEvent, OddSelection, Team } from '../../types';
import { formatEventDateTime } from '../../utils/date';
import { useBets } from '../../context/BetContext';
import { useNavigation } from '../../context/NavigationContext';
import { TeamLogo } from './TeamLogo';
import { MatchScore } from './MatchScore';
import { useLiveMatchClock, isExplicitLiveMatch } from '../../utils/liveMatch';
import { getCompetitionFlag, formatOddsVariation } from '../../utils/competition';
import { normalizeSportName } from '../../types/sports';
import { POPULAR_TEAM_LOGOS, generateTeamBadgeSvg } from '../../utils/logo';
import { MatchCardSkeleton, MatchCardSkeletonGrid } from './MatchCardSkeleton';
import { LiveBadgeWithTime } from './LiveBadgeWithTime';

export { MatchCardSkeleton, MatchCardSkeletonGrid };

interface MatchCardProps {
  event: SportEvent;
  isUpdating?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({ event, isUpdating = false }) => {
  const { selections, selectBet } = useBets();
  const { openMatchDetail } = useNavigation();

  // Mapping function to retrieve and display official logos or professional sport placeholders
  const getTeamLogo = (teamName: string, directLogo?: string, sportType?: string): string => {
    if (directLogo && directLogo.trim() !== '' && !directLogo.includes('equipe-logodefaut')) {
      return directLogo;
    }
    
    const normalizedKey = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const popularUrl = POPULAR_TEAM_LOGOS[normalizedKey];
    if (popularUrl) {
      return popularUrl;
    }

    const sport = (sportType || event.sport || 'football').toLowerCase();
    return generateTeamBadgeSvg(teamName, sport);
  };

  const homeTeam: Team = {
    id: event.teams?.home?.id || `team-home-${event.id}`,
    name: event.teams?.home?.name || event.homeTeam,
    logo: getTeamLogo(
      event.teams?.home?.name || event.homeTeam,
      event.teams?.home?.logo || (event as any).homeTeamLogo || event.homeTeamData?.logo,
      event.sport
    ),
  };

  const awayTeam: Team = {
    id: event.teams?.away?.id || `team-away-${event.id}`,
    name: event.teams?.away?.name || event.awayTeam,
    logo: getTeamLogo(
      event.teams?.away?.name || event.awayTeam,
      event.teams?.away?.logo || (event as any).awayTeamLogo || event.awayTeamData?.logo,
      event.sport
    ),
  };

  // Find 1X2 / Main Result market
  const resultMarket = event.markets.find(
    m => m.type === 'result' || m.name.toLowerCase().includes('résultat')
  );

  const isLive = isExplicitLiveMatch(event);

  // Visual notification: track live odds changes to trigger animate-flash-up or animate-flash-down for 2s
  const [oddsFlashMap, setOddsFlashMap] = useState<Record<string, 'up' | 'down'>>({});
  const prevOddsRef = useRef<Record<string, number>>({});
  const flashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Cleanup pending flash timers on unmount
  useEffect(() => {
    return () => {
      Object.values(flashTimersRef.current).forEach(t => clearTimeout(t));
    };
  }, []);

  // Monitor live odds updates and trigger animate-flash-up or animate-flash-down for 2 seconds
  useEffect(() => {
    if (!isLive || !resultMarket?.selections) return;

    const currentFlashes: Record<string, 'up' | 'down'> = {};
    let hasNewFlash = false;

    for (const sel of resultMarket.selections) {
      if (!sel || typeof sel.odds !== 'number') continue;

      const prev = prevOddsRef.current[sel.id];

      if (prev !== undefined && prev !== sel.odds) {
        const direction: 'up' | 'down' = sel.odds > prev ? 'up' : 'down';
        currentFlashes[sel.id] = direction;
        hasNewFlash = true;
      } else if (prev === undefined && sel.variationTimestamp) {
        const ageMs = Date.now() - new Date(sel.variationTimestamp).getTime();
        if (ageMs >= 0 && ageMs < 2000) {
          const dir: 'up' | 'down' =
            sel.trend === 'up' || sel.trend === 'down'
              ? sel.trend
              : typeof sel.previousOdds === 'number' && sel.odds > sel.previousOdds
              ? 'up'
              : 'down';
          currentFlashes[sel.id] = dir;
          hasNewFlash = true;
        }
      }

      prevOddsRef.current[sel.id] = sel.odds;
    }

    if (hasNewFlash) {
      setOddsFlashMap(prev => ({ ...prev, ...currentFlashes }));

      Object.entries(currentFlashes).forEach(([selId]) => {
        if (flashTimersRef.current[selId]) {
          clearTimeout(flashTimersRef.current[selId]);
        }
        flashTimersRef.current[selId] = setTimeout(() => {
          setOddsFlashMap(prev => {
            if (!prev[selId]) return prev;
            const next = { ...prev };
            delete next[selId];
            return next;
          });
          delete flashTimersRef.current[selId];
        }, 2000);
      });
    }
  }, [isLive, event.markets, resultMarket]);

  const handleSelectOdd = (e: React.MouseEvent, selection: OddSelection, marketName: string) => {
    e.stopPropagation();
    selectBet(event, selection, marketName, resultMarket?.type);
  };

  const sportKey = normalizeSportName(event.sport || 'football');
  const isTwoWay = sportKey === 'tennis' || sportKey === 'basketball' || sportKey === 'volleyball' || sportKey === 'tennis-de-table' || sportKey === 'badminton';

  let outcomesToDisplay: { label: string; selection: OddSelection | undefined }[] = [];

  if (isTwoWay) {
    const selection1 = resultMarket?.selections?.find(s => s.name === '1' || s.name.toLowerCase().includes('home') || (s.id && s.id.endsWith('-1')));
    const selection2 = resultMarket?.selections?.find(s => s.name === '2' || s.name.toLowerCase().includes('away') || (s.id && s.id.endsWith('-2')));

    const outcome1 = selection1 || resultMarket?.selections?.[0];
    const outcome2 = selection2 || (resultMarket?.selections?.length === 3 ? resultMarket?.selections?.[2] : resultMarket?.selections?.[1]);

    outcomesToDisplay = [
      { label: '1', selection: outcome1 },
      { label: '2', selection: outcome2 },
    ].filter(o => !!o.selection);
  } else {
    const outcome1 = resultMarket?.selections?.find(s => s.name === '1' || s.name === 'Home' || (s.id && s.id.endsWith('-1'))) || resultMarket?.selections?.[0];
    const outcomeN = resultMarket?.selections?.find(s => s.name === 'X' || s.name === 'N' || s.name === 'Draw' || s.name.toLowerCase().includes('nul')) || resultMarket?.selections?.[1];
    const outcome2 = resultMarket?.selections?.find(s => s.name === '2' || s.name === 'Away' || (s.id && s.id.endsWith('-2'))) || resultMarket?.selections?.[2];

    outcomesToDisplay = [
      { label: '1', selection: outcome1 },
      { label: 'N', selection: outcomeN },
      { label: '2', selection: outcome2 },
    ].filter(o => !!o.selection);
  }

  return (
    <div
      onClick={() => openMatchDetail(event.id)}
      className="bg-white dark:bg-[#0b1222] rounded-3xl p-3.5 sm:p-5 border border-[#e0edfb] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,102,255,0.04)] hover:shadow-md hover:border-blue-300 dark:hover:border-slate-700 transition-all cursor-pointer select-none group w-full max-w-full min-w-0 box-border overflow-hidden relative text-slate-900 dark:text-slate-100"
    >
      {/* Background data updating shimmer overlay */}
      {isUpdating && (
        <div
          className="absolute inset-0 pointer-events-none z-10 animate-shimmer opacity-30 bg-gradient-to-r from-blue-500/5 via-blue-500/15 to-blue-500/5 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* 1. Header: Trophy + Competition (Left) & Single Live/Status Badge (Right) */}
      <div className="flex items-center justify-between gap-2 mb-2 text-xs min-w-0">
        <div className="flex items-center gap-1.5 text-[#071838] dark:text-slate-200 font-bold truncate min-w-0 flex-1">
          <span className="text-sm shrink-0">🏆</span>
          <span className="truncate text-xs sm:text-sm">{event.competition}</span>
        </div>

        <div className="shrink-0">
          {isLive ? (
            <LiveBadgeWithTime event={event} size="md" />
          ) : event.status === 'finished' ? (
            <span className="text-slate-400 dark:text-slate-300 font-bold text-xs">Terminé</span>
          ) : (
            <span className="text-[#0066ff] dark:text-blue-400 font-bold text-xs font-mono bg-blue-50/70 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
              {formatEventDateTime(event.startTime)}
            </span>
          )}
        </div>
      </div>

      {/* 2. Teams & Score Line */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-1 mb-2.5 w-full min-w-0">
        
        {/* Home Team (Left) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <TeamLogo team={homeTeam} size="md" />
          <span className="text-xs sm:text-base font-bold text-[#071838] dark:text-white truncate group-hover:text-[#0066ff] dark:group-hover:text-blue-400 transition-colors leading-tight">
            {homeTeam.name}
          </span>
        </div>

        {/* Score Pill / VS (Center) */}
        <div className="flex flex-col items-center justify-center text-center px-1 shrink-0">
          <MatchScore
            score={event.score}
            status={event.status}
            isLive={isLive}
            isFinished={event.status === 'finished'}
            size="md"
          />
        </div>

        {/* Away Team (Right) */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0 text-right">
          <span className="text-xs sm:text-base font-bold text-[#071838] dark:text-white truncate group-hover:text-[#0066ff] dark:group-hover:text-blue-400 transition-colors leading-tight">
            {awayTeam.name}
          </span>
          <TeamLogo team={awayTeam} size="md" />
        </div>

      </div>

      {/* 3. Real Odds with Variations underneath */}
      {outcomesToDisplay.length > 0 && resultMarket && (
        <div className={`grid gap-1.5 sm:gap-2 pt-2.5 border-t w-full max-w-full min-w-0 box-border transition-colors duration-300 ${
          isLive && outcomesToDisplay.some(o => o.selection && oddsFlashMap[o.selection.id])
            ? 'border-blue-300 dark:border-blue-700'
            : 'border-blue-100/60 dark:border-slate-800'
        } ${
          outcomesToDisplay.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
        }`}>
          {outcomesToDisplay.map(({ label, selection }) => {
            if (!selection) return null;

            const isSelected = selections.some(
              s => s.event.id === event.id && s.selection.id === selection.id
            );

            const isSuspended = Boolean(resultMarket?.isSuspended || selection.isSuspended);

            const variation = formatOddsVariation(
              selection.odds,
              selection.previousOdds,
              selection.trend
            );

            const flashDir = isLive && !isSuspended ? oddsFlashMap[selection.id] : undefined;
            const flashClass = flashDir === 'up'
              ? 'animate-flash-up'
              : flashDir === 'down'
              ? 'animate-flash-down'
              : '';

            return (
              <button
                key={`${event.id}-${selection.id}-${label}`}
                type="button"
                disabled={isSuspended}
                onClick={e => {
                  if (isSuspended) return;
                  handleSelectOdd(e, selection, resultMarket.name);
                }}
                className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl flex flex-col items-center justify-center transition-all min-w-0 box-border ${
                  isSuspended
                    ? 'bg-slate-100/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'bg-[#0066ff] text-white font-bold shadow-md shadow-blue-500/25 ring-2 ring-[#0066ff] cursor-pointer'
                    : 'bg-[#f8fbff] dark:bg-slate-900 hover:bg-blue-50/70 dark:hover:bg-slate-800 text-[#071838] dark:text-slate-200 border border-[#cde3fb] dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 cursor-pointer'
                } ${flashClass}`}
                title={
                  isSuspended
                    ? `Cote suspendue pour ${selection.name}`
                    : `Parier sur ${selection.name} à ${(typeof selection.odds === 'number' ? selection.odds.toFixed(2) : 'N/A')}${
                        variation ? ` (Variation: ${variation.direction === 'up' ? 'hausse' : 'baisse'})` : ''
                      }`
                }
              >
                {/* 1 / X / 2 Label */}
                <span className={`text-[10px] uppercase font-bold leading-none mb-1 ${
                  isSuspended
                    ? 'text-slate-400 dark:text-slate-500'
                    : isSelected
                    ? 'text-blue-100'
                    : 'text-slate-400 dark:text-slate-300'
                }`}>
                  {label}
                </span>

                {/* Main Odds value */}
                <span className="text-xs sm:text-sm font-black font-mono leading-tight flex items-center justify-center gap-1">
                  {isSuspended ? (
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-300">—</span>
                  ) : typeof selection.odds === 'number' ? (
                    selection.odds.toFixed(2)
                  ) : (
                    'N/A'
                  )}
                  {!isSuspended && (variation?.direction === 'up' || flashDir === 'up') && (
                    <span
                      className={`text-[9px] leading-none inline-flex items-center ${
                        isSelected ? 'text-white' : 'text-emerald-500 font-bold'
                      }`}
                      aria-label="Hausse de cote"
                    >
                      ▲
                    </span>
                  )}
                  {!isSuspended && (variation?.direction === 'down' || flashDir === 'down') && (
                    <span
                      className={`text-[9px] leading-none inline-flex items-center ${
                        isSelected ? 'text-white' : 'text-rose-500 font-bold'
                      }`}
                      aria-label="Baisse de cote"
                    >
                      ▼
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
