import React from 'react';
import { X, Trophy, ChevronRight, Check } from 'lucide-react';
import { SPORT_LABELS, SPORT_EMOJIS, normalizeSportName } from '../../types/sports';

export interface SportItem {
  id: string;
  name: string;
  icon: string;
}

interface SportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
  sportsCounts?: Record<string, number>;
}

export const SportsModal: React.FC<SportsModalProps> = ({
  isOpen,
  onClose,
  selectedSport,
  onSelectSport,
  sportsCounts = {},
}) => {
  if (!isOpen) return null;

  const dynamicSports = Object.entries(sportsCounts)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => {
      const normId = normalizeSportName(id);
      return {
        id: normId,
        name: SPORT_LABELS[normId] || id.charAt(0).toUpperCase() + id.slice(1),
        icon: SPORT_EMOJIS[normId] || '🏆',
        count,
      };
    })
    // Group duplicates if normalization merges them (e.g. "American Football" and "american-football")
    .reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (existing) {
        existing.count += current.count;
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as { id: string; name: string; icon: string; count: number }[])
    .sort((a, b) => b.count - a.count); // Most active sports first

  const totalMatchesCount = Object.values(sportsCounts).reduce((a, b) => a + b, 0);

  const allSportsList = [
    { id: 'all', name: 'Tous les sports', icon: '🏆', count: totalMatchesCount },
    ...dynamicSports,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Toutes les disciplines</h3>
              <p className="text-xs text-slate-500">Sélectionnez une discipline sportive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of all sports */}
        <div className="p-4 space-y-1.5 overflow-y-auto">
          {allSportsList.map(sport => {
            const isSelected = selectedSport === sport.id;
            const count = sport.id === 'all'
              ? Object.values(sportsCounts).reduce((a, b) => a + b, 0)
              : sportsCounts[sport.id] || (sport as any).count || 0;

            return (
              <button
                key={sport.id}
                onClick={() => {
                  onSelectSport(sport.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all text-left ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sport.icon}</span>
                  <div>
                    <span className="text-sm block">{sport.name}</span>
                    {count > 0 && (
                      <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {count} {count > 1 ? 'événements disponibles' : 'événement'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
