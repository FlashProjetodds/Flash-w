import React, { useState } from 'react';
import { X, Trash2, CheckCircle2, AlertCircle, Wallet, Layers, Ticket, AlertTriangle } from 'lucide-react';
import { useBets } from '../../context/BetContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/date';
import { TeamLogo } from '../sports/TeamLogo';

interface BetSlipDrawerProps {
  onRequireAuth: () => void;
}

export const BetSlipDrawer: React.FC<BetSlipDrawerProps> = ({ onRequireAuth }) => {
  const {
    selections,
    stake,
    setStake,
    totalOdds,
    potentialPayout,
    hasSuspendedSelections,
    removeSelection,
    clearSlip,
    submitCoupon,
    isSlipOpen,
    setIsSlipOpen,
    acceptAllOdds,
    setAcceptAllOdds,
    placingBet,
    countdown,
  } = useBets();

  const { user, isAuthenticated } = useAuth();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (selections.length === 0) return null;

  const isCombined = selections.length > 1;

  const handlePlaceBet = async () => {
    setFeedback(null);

    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (hasSuspendedSelections) {
      setFeedback({
        type: 'error',
        message: 'Cote suspendue : impossible de valider le coupon pendant la suspension.',
      });
      return;
    }

    const res = await submitCoupon();
    if (res.success) {
      setFeedback({
        type: 'success',
        message: isCombined
          ? `Coupon combiné #${res.coupon?.id} validé avec succès (${selections.length} sélections) !`
          : `Coupon #${res.coupon?.id} validé avec succès !`,
      });
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Erreur lors de la validation du coupon.',
      });
    }
  };

  return (
    <>
      {/* Floating Action Button above bottom nav */}
      {!isSlipOpen && selections.length > 0 && (
        <button
          onClick={() => setIsSlipOpen(true)}
          className={`fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 min-h-[48px] px-4 py-2.5 ${
            hasSuspendedSelections
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/35'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/35'
          } active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full shadow-xl flex items-center gap-2 cursor-pointer transition-all animate-bounce`}
          title="Ouvrir le coupon"
        >
          <Ticket className="w-4 h-4" />
          <span>
            Coupon ({selections.length}) · {hasSuspendedSelections ? 'Cote suspendue' : totalOdds.toFixed(2)}
          </span>
        </button>
      )}

      {/* Slip Drawer Container */}
      {isSlipOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:static md:z-auto bg-white border-t md:border border-slate-200/90 rounded-t-3xl md:rounded-3xl p-4 sm:p-5 shadow-2xl transition-all max-h-[85vh] md:max-h-none overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Coupon de pari
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold">
                {selections.length} {selections.length > 1 ? 'sélections' : 'sélection'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearSlip}
                aria-label="Vider le coupon"
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="Tout supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsSlipOpen(false)}
                aria-label="Réduire"
                className="text-slate-400 hover:text-slate-700 p-1 transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Combinations Info Banner */}
          {selections.length >= 2 && (
            <div className="mt-3 p-2.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Pari combiné</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600">
                1 seul coupon multi-matchs
              </span>
            </div>
          )}

          {/* Odds Preference Toggle */}
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span>Variations de cotes</span>
            <button
              onClick={() => setAcceptAllOdds(!acceptAllOdds)}
              className={`px-2 py-1 rounded-lg ${acceptAllOdds ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}
            >
              {acceptAllOdds ? 'Accepter tout' : 'Uniquement si hausse'}
            </button>
          </div>

          {/* Feedback messages */}
          {feedback && (
            <div
              className={`mt-3 p-3 rounded-2xl text-xs flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* List of Selections */}
          <div className="mt-3 space-y-2 max-h-72 sm:max-h-96 overflow-y-auto pr-1">
            {selections.map((item, idx) => {
              const isSuspended = Boolean(item.isSuspended || item.selection.isSuspended);

              const homeTeamData = {
                id: item.event.teams?.home?.id || `team-home-${item.event.id}`,
                name: item.event.teams?.home?.name || item.event.homeTeam,
                logo: item.event.teams?.home?.logo || (item.event as any).homeTeamLogo || item.event.homeTeamData?.logo,
              };
              const awayTeamData = {
                id: item.event.teams?.away?.id || `team-away-${item.event.id}`,
                name: item.event.teams?.away?.name || item.event.awayTeam,
                logo: item.event.teams?.away?.logo || (item.event as any).awayTeamLogo || item.event.awayTeamData?.logo,
              };

              return (
                <div
                  key={`${item.selection.id}-${idx}`}
                  className={`p-3 rounded-2xl space-y-2 relative group transition-all duration-200 ${
                    isSuspended
                      ? 'bg-slate-100/90 border border-amber-300/80 opacity-70 grayscale-[0.35]'
                      : 'bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => removeSelection(item.selection.id, item.event.id, item.marketName)}
                    aria-label="Supprimer cette sélection"
                    className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pr-6">
                    <span className="capitalize font-semibold text-blue-600">{item.event.sport}</span>
                    <span>·</span>
                    <span className="truncate">{item.event.competition}</span>
                    {item.event.status === 'live' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pr-6">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <TeamLogo team={homeTeamData} size="sm" />
                      <span className="text-xs font-bold text-slate-900">{item.event.homeTeam}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">vs</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <TeamLogo team={awayTeamData} size="sm" />
                      <span className="text-xs font-bold text-slate-900">{item.event.awayTeam}</span>
                    </div>
                  </div>

                  {isSuspended && (
                    <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-800 text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Cote suspendue (mise à jour en cours)</span>
                    </div>
                  )}

                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 space-y-0.5">
                    <div className="text-[11px] text-slate-500">
                      Marché : <span className="text-slate-800 font-semibold">{item.marketName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500">Sélection : </span>
                        <strong className={isSuspended ? 'text-slate-500 font-medium' : 'text-blue-600 font-bold'}>
                          {item.displaySelection || item.selection.name}
                        </strong>
                      </div>

                      {isSuspended ? (
                        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                          Suspendue
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {item.variation && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                item.trend === 'up'
                                  ? 'text-emerald-700 bg-emerald-50'
                                  : item.trend === 'down'
                                  ? 'text-rose-700 bg-rose-50'
                                  : 'text-slate-500 bg-slate-50'
                              }`}
                            >
                              {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : ''} {item.variation}
                            </span>
                          )}
                          <span className="text-xs font-black font-mono text-blue-600 tabular-nums">
                            @ {typeof item.selection.odds === 'number' ? item.selection.odds.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined Odds Summary */}
          {isCombined && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-700 font-bold">Cote totale combinée :</span>
                <div className="text-[10px] text-blue-600">
                  {selections.length} sélections sur un coupon unique
                </div>
              </div>
              <span className="text-lg font-black font-mono text-blue-600 tabular-nums">
                {totalOdds.toFixed(2)}
              </span>
            </div>
          )}

          {/* Stake Input & Presets */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700">
                {isCombined ? 'Mise totale combinée (FCFA)' : 'Mise (FCFA)'}
              </label>
              {user && (
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-blue-600" />
                  Solde : <strong className="text-slate-900 font-mono">{formatCurrency(user.balance)}</strong>
                </span>
              )}
            </div>

            <input
              type="number"
              min="100"
              step="100"
              value={stake || ''}
              onChange={e => setStake(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full min-h-[44px] px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />

            {/* Quick Stake Preset Buttons */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[500, 1000, 5000, 10000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStake(val)}
                  className={`min-h-[36px] text-xs font-bold rounded-xl border transition-all ${
                    stake === val
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {val.toLocaleString('fr-FR')} FCFA
                </button>
              ))}
            </div>
          </div>

          {/* Potential Payout */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">Gain potentiel</span>
            <span className="text-lg font-black font-mono text-emerald-600 tabular-nums">
              {formatCurrency(potentialPayout)}
            </span>
          </div>

          {/* Place Bet Action Button */}
          {placingBet ? (
            <button
              type="button"
              disabled
              className="w-full min-h-[46px] mt-3 py-2.5 px-4 bg-slate-300 text-slate-600 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              Validation dans {countdown}s...
            </button>
          ) : hasSuspendedSelections ? (
            <div className="space-y-1.5 mt-3">
              <button
                type="button"
                disabled
                className="w-full min-h-[46px] py-2.5 px-4 bg-slate-200 border border-slate-300/80 text-slate-500 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed transition-all opacity-85 shadow-none"
                title="Validation temporairement bloquée car une cote sélectionnée est suspendue"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Cote suspendue</span>
              </button>
              <p className="text-[11px] text-amber-700 text-center font-medium">
                Validation temporairement bloquée · Une sélection est suspendue
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePlaceBet}
              className="w-full min-h-[46px] mt-3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {isAuthenticated
                  ? isCombined
                    ? `Valider le combiné (${selections.length} matchs)`
                    : 'Valider le coupon'
                  : 'Se connecter pour parier'}
              </span>
            </button>
          )}
        </div>
      )}
    </>
  );
};
