import React, { useState } from 'react';
import {
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Layers,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useBets } from '../../context/BetContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatCurrency, formatFullDateTime } from '../../utils/date';
import { BetStatus, Coupon, Bet, CouponSelection, Team } from '../../types';
import { TeamLogo } from '../sports/TeamLogo';

export const MyBetsView: React.FC = () => {
  const { myBets, myCoupons, triggerSettlementCheck, isSettling } = useBets();
  const { goBack, navigateTo } = useNavigation();

  // Tabs: Type filter & Status filter
  const [typeFilter, setTypeFilter] = useState<'all' | 'coupons' | 'simples'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'finished'>('all');

  // Filter combined coupons
  const filteredCoupons = myCoupons.filter(c => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return c.status === 'pending';
    if (statusFilter === 'finished') return c.status === 'won' || c.status === 'lost' || c.status === 'cancelled' || c.status === 'void';
    return true;
  });

  // Filter single bets (excluding bets that belong to a combined coupon to prevent clutter, unless viewing simples)
  const filteredSingleBets = myBets.filter(b => {
    if (typeFilter === 'coupons') return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return b.status === 'pending';
    if (statusFilter === 'finished') return b.status === 'won' || b.status === 'lost' || b.status === 'cancelled' || b.status === 'void';
    return true;
  });

  const getStatusBadge = (status: BetStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>EN ATTENTE</span>
          </span>
        );
      case 'won':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>GAGNÉ</span>
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>PERDU</span>
          </span>
        );
      case 'cancelled':
      case 'void':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>ANNULÉ (VOID)</span>
          </span>
        );
    }
  };

  const getLegStatusBadge = (status: BetStatus) => {
    switch (status) {
      case 'won':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>✓ GAGNÉ</span>
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>✕ PERDU</span>
          </span>
        );
      case 'cancelled':
      case 'void':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>ANNULÉ (COTE 1.00)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>EN ATTENTE</span>
          </span>
        );
    }
  };

  const totalItemsCount = myCoupons.length + myBets.filter(b => !b.couponId).length;

  return (
    <div className="space-y-3.5 sm:space-y-5 pb-24 w-full max-w-full min-w-0 overflow-hidden box-border mx-auto">
      
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5 w-full max-w-full min-w-0 box-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={goBack}
            aria-label="Retour"
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all shadow-xs shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 font-display truncate">
                Mes Paris & Coupons
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                OFFICIEL
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Résultats sportifs en direct & historique
            </p>
          </div>
        </div>

        {/* Trigger Settlement Check Button */}
        <button
          onClick={triggerSettlementCheck}
          disabled={isSettling}
          className="min-h-[38px] px-3.5 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-blue-600 text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto shadow-xs active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSettling ? 'animate-spin text-blue-600' : ''}`} />
          <span>{isSettling ? 'Vérification...' : 'Vérifier résultats'}</span>
        </button>
      </div>

      {/* 2. Primary Category Filters (Image 2 style: rounded light pills, crisp white & blue) */}
      <div className="space-y-2 w-full max-w-full min-w-0 box-border">
        {/* Row 1: Type Selector (Tout / Coupons combinés / Paris simples) */}
        <div className="w-full max-w-full min-w-0 box-border">
          <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs w-full max-w-full min-w-0 box-border overflow-hidden">
            <button
              onClick={() => setTypeFilter('all')}
              className={`min-h-[36px] sm:min-h-[38px] px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center text-center min-w-0 flex-1 ${
                typeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="truncate block">Tout ({totalItemsCount})</span>
            </button>
            <button
              onClick={() => setTypeFilter('coupons')}
              className={`min-h-[36px] sm:min-h-[38px] px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all text-center min-w-0 flex-1 ${
                typeFilter === 'coupons'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span className="truncate block">
                <span className="hidden sm:inline">Coupons </span>Combinés ({myCoupons.length})
              </span>
            </button>
            <button
              onClick={() => setTypeFilter('simples')}
              className={`min-h-[36px] sm:min-h-[38px] px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all text-center min-w-0 flex-1 ${
                typeFilter === 'simples'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span className="truncate block">
                <span className="hidden sm:inline">Paris </span>Simples ({myBets.length})
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter (Tous statuts / En attente / Terminés) */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-slate-200/80 rounded-2xl text-xs shadow-xs w-full max-w-full min-w-0 box-border overflow-hidden">
          <button
            onClick={() => setStatusFilter('all')}
            className={`min-h-[32px] sm:min-h-[34px] px-1 sm:px-2 rounded-xl font-bold transition-all text-center min-w-0 flex-1 text-[11px] sm:text-xs ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="truncate block">Tous statuts</span>
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`min-h-[32px] sm:min-h-[34px] px-1 sm:px-2 rounded-xl font-bold transition-all text-center min-w-0 flex-1 text-[11px] sm:text-xs ${
              statusFilter === 'pending'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="truncate block">En attente</span>
          </button>
          <button
            onClick={() => setStatusFilter('finished')}
            className={`min-h-[32px] sm:min-h-[34px] px-1 sm:px-2 rounded-xl font-bold transition-all text-center min-w-0 flex-1 text-[11px] sm:text-xs ${
              statusFilter === 'finished'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="truncate block">Terminés</span>
          </button>
        </div>
      </div>

      {/* 3. Empty State (Clean light theme) */}
      {filteredCoupons.length === 0 && filteredSingleBets.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white border border-slate-200/80 rounded-3xl max-w-md mx-auto shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1 font-display">
            Aucun pari ou coupon enregistré
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Sélectionnez une ou plusieurs rencontres sportives sur FLASH pour créer vos coupons simples ou combinés.
          </p>
          <button
            onClick={() => navigateTo('home')}
            className="min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-blue-500/20"
          >
            Consulter les matchs en direct & à venir
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          
          {/* 4. SECTION: COUPONS DE PARIS COMBINÉS & SIMPLES */}
          {(typeFilter === 'all' || typeFilter === 'coupons') && filteredCoupons.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Coupons de Paris ({filteredCoupons.length})</span>
              </div>

              {filteredCoupons.map((coupon: Coupon) => {
                const isSingle = coupon.type === 'simple';

                return (
                  <div
                    key={coupon.id}
                    className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3 transition-all w-full max-w-full min-w-0 overflow-hidden box-border"
                  >
                    {/* Coupon Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Circle count badge */}
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black font-mono text-xs sm:text-sm shrink-0">
                          {coupon.selections.length}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="text-xs sm:text-base font-black font-mono text-slate-900 truncate">
                              Coupon #{coupon.id}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 shrink-0">
                              {isSingle ? 'Pari Simple' : `Combiné ${coupon.selections.length} sélections`}
                            </span>
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                            Placé le {formatFullDateTime(coupon.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">{getStatusBadge(coupon.status)}</div>
                    </div>

                    {/* List of Legs (Detail of each selection in Image 2 card style) */}
                    <div className="space-y-2 w-full max-w-full min-w-0 box-border">
                      <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                        Détail des sélections ({coupon.selections.length}) :
                      </div>

                      <div className="space-y-2 w-full max-w-full min-w-0 box-border">
                        {coupon.selections.map((sel: CouponSelection, sIdx: number) => {
                          const homeTeamData: Team = {
                            id: `th-${sel.eventId}`,
                            name: sel.homeTeam,
                            logo: sel.homeTeamLogo,
                          };
                          const awayTeamData: Team = {
                            id: `ta-${sel.eventId}`,
                            name: sel.awayTeam,
                            logo: sel.awayTeamLogo,
                          };

                          const hasScore =
                            typeof sel.finalScoreHome === 'number' &&
                            typeof sel.finalScoreAway === 'number';

                          const oddsValue = (sel.oddsAtPlacement || sel.odds).toFixed(2);

                          return (
                            <div
                              key={`${coupon.id}-${sel.id}-${sIdx}`}
                              className="p-2.5 sm:p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2 hover:bg-slate-50 transition-colors w-full max-w-full min-w-0 overflow-hidden box-border"
                            >
                              {/* Top row: Sport/Comp & Status badge */}
                              <div className="flex items-center justify-between gap-1.5 text-[11px] min-w-0">
                                <div className="text-slate-500 flex items-center gap-1.5 truncate font-medium min-w-0 flex-1">
                                  <span className="capitalize font-bold text-blue-600 shrink-0">{sel.sport}</span>
                                  <span className="shrink-0">·</span>
                                  <span className="truncate">{sel.competition}</span>
                                </div>
                                <div className="shrink-0">{getLegStatusBadge(sel.status)}</div>
                              </div>

                              {/* Teams with logos, Score & Blue Odds Badge (Image 2 style) */}
                              <div className="flex items-center justify-between gap-1.5 sm:gap-2 py-1 w-full min-w-0">
                                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                  {/* Home Team */}
                                  <div className="flex items-center gap-1 min-w-0 flex-1">
                                    <TeamLogo team={homeTeamData} size="sm" />
                                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                                      {sel.homeTeam}
                                    </span>
                                  </div>

                                  {/* Score or vs */}
                                  {hasScore ? (
                                    <div className="score flex flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-lg bg-white border border-slate-200 text-blue-600 font-mono font-black text-xs whitespace-nowrap shrink-0">
                                      <span>{sel.finalScoreHome}</span>
                                      <span className="text-slate-400">-</span>
                                      <span>{sel.finalScoreAway}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0 px-1">
                                      vs
                                    </span>
                                  )}

                                  {/* Away Team */}
                                  <div className="flex items-center justify-end gap-1 min-w-0 flex-1 text-right">
                                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                                      {sel.awayTeam}
                                    </span>
                                    <TeamLogo team={awayTeamData} size="sm" />
                                  </div>
                                </div>

                                {/* Blue Odds Badge matching Image 2 */}
                                <div className="shrink-0 pl-1">
                                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black font-mono text-xs sm:text-sm shadow-xs shadow-blue-500/25">
                                    {oddsValue}
                                  </span>
                                </div>
                              </div>

                              {/* Market & Selection detail box (Light white card) */}
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs w-full max-w-full min-w-0 overflow-hidden box-border">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 min-w-0">
                                  <div className="min-w-0">
                                    <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                                      Marché :
                                    </span>
                                    <span className="text-slate-800 font-semibold truncate block">{sel.marketName}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                                      Sélection :
                                    </span>
                                    <strong className="text-blue-600 font-bold truncate block">
                                      {sel.displaySelection || sel.selectionName}
                                    </strong>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-[11px] min-w-0">
                                  <div className="text-slate-500">
                                    Cote enregistrée : <strong className="text-slate-800 font-mono font-bold">@ {oddsValue}</strong>
                                  </div>

                                  <div className="min-w-0">
                                    {hasScore ? (
                                      <span className="text-slate-600 font-mono text-[10px] sm:text-[11px] break-words">
                                        Score final : <strong className="text-slate-900">{sel.homeTeam} {sel.finalScoreHome} — {sel.finalScoreAway} {sel.awayTeam}</strong>
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-mono text-[10px]">Score : En attente</span>
                                    )}
                                  </div>
                                </div>

                                {sel.officialResult && (
                                  <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100 flex items-center justify-between min-w-0">
                                    <span>Résultat officiel : <strong className="text-slate-900 truncate">{sel.officialResult}</strong></span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Coupon Financial Summary Footer */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs w-full max-w-full min-w-0 box-border">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Mise</span>
                          <strong className="text-slate-900 font-mono font-bold text-xs sm:text-sm">{formatCurrency(coupon.amount)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Cote combinée</span>
                          <strong className="text-blue-600 font-mono font-black text-xs sm:text-sm">{coupon.totalOdds.toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                          {coupon.status === 'won'
                            ? 'Gain crédité'
                            : coupon.status === 'lost'
                            ? 'Gain'
                            : coupon.status === 'cancelled' || coupon.status === 'void'
                            ? 'Remboursement'
                            : 'Gain potentiel'}
                        </span>
                        <span
                          className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                            coupon.status === 'won'
                              ? 'text-emerald-600'
                              : coupon.status === 'lost'
                              ? 'text-slate-400'
                              : coupon.status === 'cancelled' || coupon.status === 'void'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {coupon.status === 'won'
                            ? formatCurrency(coupon.actualPayout || coupon.potentialPayout)
                            : coupon.status === 'lost'
                            ? formatCurrency(0)
                            : coupon.status === 'cancelled' || coupon.status === 'void'
                            ? formatCurrency(coupon.amount)
                            : formatCurrency(coupon.potentialPayout)}
                        </span>
                      </div>
                    </div>

                    {/* Status & Settlement details footer */}
                    <div className="text-[10px] font-mono text-slate-400 pt-1 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 min-w-0">
                      <div>
                        Statut : <strong className="text-slate-800 uppercase">{coupon.status === 'won' ? 'GAGNÉ' : coupon.status === 'lost' ? 'PERDU' : coupon.status === 'cancelled' ? 'ANNULÉ' : 'EN ATTENTE'}</strong>
                      </div>
                      {coupon.settlementId && (
                        <div className="flex items-center gap-1.5 text-slate-400 truncate">
                          <span>Règlement : {coupon.settlementId}</span>
                          {coupon.settledAt && <span>· Validé le {formatFullDateTime(coupon.settledAt)}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. SECTION: PARIS SIMPLES INDIVIDUELS */}
          {(typeFilter === 'all' || typeFilter === 'simples') && filteredSingleBets.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                <Ticket className="w-4 h-4 text-blue-600" />
                <span>Paris Simples ({filteredSingleBets.length})</span>
              </div>

              {filteredSingleBets.map((bet: Bet) => {
                const homeTeamName = bet.homeTeam || bet.eventName.split(' vs ')[0] || 'Domicile';
                const awayTeamName = bet.awayTeam || bet.eventName.split(' vs ')[1] || 'Extérieur';

                const homeTeamData: Team = {
                  id: `th-${bet.id}`,
                  name: homeTeamName,
                  logo: bet.homeTeamLogo,
                };
                const awayTeamData: Team = {
                  id: `ta-${bet.id}`,
                  name: awayTeamName,
                  logo: bet.awayTeamLogo,
                };

                const hasScore =
                  typeof bet.finalScoreHome === 'number' &&
                  typeof bet.finalScoreAway === 'number';

                const oddsValue = (bet.oddsAtPlacement || bet.odds).toFixed(2);

                return (
                  <div
                    key={bet.id}
                    className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-5 hover:border-blue-300 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3 w-full max-w-full min-w-0 overflow-hidden box-border"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 min-w-0">
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate flex-1 min-w-0">
                        {bet.sport} · {bet.competition} · Pari #{bet.id}
                      </span>
                      <div className="shrink-0">{getStatusBadge(bet.status)}</div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 sm:gap-2 py-1 w-full min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <TeamLogo team={homeTeamData} size="sm" />
                          <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                            {homeTeamName}
                          </span>
                        </div>

                        {hasScore ? (
                          <div className="score flex flex-row items-center justify-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-blue-600 font-mono font-black text-xs whitespace-nowrap shrink-0">
                            <span>{bet.finalScoreHome}</span>
                            <span className="text-slate-400">-</span>
                            <span>{bet.finalScoreAway}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0 px-1">vs</span>
                        )}

                        <div className="flex items-center justify-end gap-1 min-w-0 flex-1 text-right">
                          <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                            {awayTeamName}
                          </span>
                          <TeamLogo team={awayTeamData} size="sm" />
                        </div>
                      </div>

                      {/* Blue Odds Badge matching Image 2 */}
                      <div className="shrink-0 pl-1">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black font-mono text-xs sm:text-sm shadow-xs shadow-blue-500/25">
                          {oddsValue}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs w-full max-w-full min-w-0 overflow-hidden box-border">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 min-w-0">
                        <div className="min-w-0">
                          <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Marché :</span>
                          <span className="text-slate-800 font-semibold truncate block">{bet.marketName}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Sélection :</span>
                          <strong className="text-blue-600 font-bold truncate block">
                            {bet.displaySelection || bet.selectionName}
                          </strong>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/60 text-[11px] min-w-0">
                        <div>
                          <span className="text-slate-500">
                            Cote enregistrée : <strong className="text-slate-800 font-mono font-bold">@ {oddsValue}</strong>
                          </span>
                        </div>

                        <div className="min-w-0">
                          {hasScore ? (
                            <span className="text-slate-600 font-mono text-[10px] sm:text-[11px] break-words">
                              Score final : <strong className="text-slate-900">{homeTeamName} {bet.finalScoreHome} — {bet.finalScoreAway} {awayTeamName}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">Score : En attente</span>
                          )}
                        </div>
                      </div>

                      {bet.officialResult && (
                        <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200/60 flex items-center justify-between min-w-0">
                          <span>Résultat officiel : <strong className="text-slate-900 truncate">{bet.officialResult}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs w-full max-w-full min-w-0 box-border">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Mise</span>
                          <strong className="text-slate-900 font-mono font-bold text-xs sm:text-sm">{formatCurrency(bet.amount)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Cote</span>
                          <strong className="text-blue-600 font-mono font-black text-xs sm:text-sm">{oddsValue}</strong>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                          {bet.status === 'won' ? 'Gain crédité' : bet.status === 'lost' ? 'Gain' : 'Gain potentiel'}
                        </span>
                        <span
                          className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                            bet.status === 'won'
                              ? 'text-emerald-600'
                              : bet.status === 'lost'
                              ? 'text-slate-400'
                              : 'text-emerald-600'
                          }`}
                        >
                          {bet.status === 'won'
                            ? formatCurrency(bet.actualPayout || bet.potentialPayout)
                            : bet.status === 'lost'
                            ? formatCurrency(0)
                            : formatCurrency(bet.potentialPayout)}
                        </span>
                      </div>
                    </div>

                    {bet.settlementId && (
                      <div className="text-[10px] font-mono text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100 min-w-0">
                        <span>Règlement : {bet.settlementId}</span>
                        {bet.settledAt && <span>Validé le {formatFullDateTime(bet.settledAt)}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* 6. Integrity & Security Notice (Clean light theme) */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs text-slate-500 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Règlement automatisé certifié sans intervention manuelle · Données réelles protégées</span>
        </div>
        <span className="font-bold text-slate-800">FLASH Intégrité</span>
      </div>

    </div>
  );
};
