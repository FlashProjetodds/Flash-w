import React, { useState, useMemo } from 'react';
import { X, Search, Check, ChevronRight, Shield } from 'lucide-react';

export interface LeagueOption {
  id: string;
  name: string;
  count: number;
}

interface LeaguesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeague: string;
  onSelectLeague: (leagueId: string) => void;
  leagues: LeagueOption[];
  sportName?: string;
}

export const LeaguesModal: React.FC<LeaguesModalProps> = ({
  isOpen,
  onClose,
  selectedLeague,
  onSelectLeague,
  leagues,
  sportName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeagues = useMemo(() => {
    if (!searchQuery.trim()) return leagues;
    const q = searchQuery.toLowerCase().trim();
    return leagues.filter(l => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q));
  }, [leagues, searchQuery]);

  const totalMatches = useMemo(() => {
    return leagues.reduce((sum, l) => sum + l.count, 0);
  }, [leagues]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Ligues & Championnats
              </h3>
              <p className="text-xs text-slate-500">
                {sportName ? `Filtrer pour ${sportName}` : 'Sélectionnez une compétition'} ({leagues.length} disponibles)
              </p>
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

        {/* Search bar inside modal */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher une ligue, tournoi..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent transition-all shadow-xs"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List of leagues */}
        <div className="p-3.5 space-y-1.5 overflow-y-auto flex-1">
          {/* Option: Toutes les ligues */}
          <button
            onClick={() => {
              onSelectLeague('all');
              onClose();
            }}
            className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all text-left ${
              selectedLeague === 'all'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🌐</span>
              <div>
                <span className="text-sm font-bold block">Toutes les ligues</span>
                <span className={`text-[11px] ${selectedLeague === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {totalMatches} {totalMatches > 1 ? 'matchs au total' : 'match'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedLeague === 'all' ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {/* Filtered leagues list */}
          {filteredLeagues.map(league => {
            const isSelected = selectedLeague.toLowerCase() === league.id.toLowerCase();

            return (
              <button
                key={league.id}
                onClick={() => {
                  onSelectLeague(league.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all text-left ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <span className="text-lg shrink-0">🏆</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold block truncate">{league.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {league.count} {league.count > 1 ? 'matchs' : 'match'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelected ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                      {league.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredLeagues.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aucune compétition ne correspond à « {searchQuery} »
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
