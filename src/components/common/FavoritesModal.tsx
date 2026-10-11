import React, { useState, useEffect } from 'react';
import { X, Star, Trophy, Search, Check, Trash2, Sparkles } from 'lucide-react';
import { POPULAR_TEAM_LOGOS } from '../../utils/logo';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterFavoriteMatches?: (teamOrLeague: string) => void;
}

const DEFAULT_FAVORITE_TEAMS = ['Real Madrid', 'FC Barcelone', 'Manchester United', 'Paris Saint-Germain'];
const DEFAULT_FAVORITE_LEAGUES = ['Premier League', 'La Liga', 'Ligue des champions'];

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  onFilterFavoriteMatches,
}) => {
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('flash_user_fav_teams_v1');
      return stored ? JSON.parse(stored) : DEFAULT_FAVORITE_TEAMS;
    } catch {
      return DEFAULT_FAVORITE_TEAMS;
    }
  });

  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('flash_user_fav_leagues_v1');
      return stored ? JSON.parse(stored) : DEFAULT_FAVORITE_LEAGUES;
    } catch {
      return DEFAULT_FAVORITE_LEAGUES;
    }
  });

  const [activeTab, setActiveTab] = useState<'teams' | 'leagues'>('teams');
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('flash_user_fav_teams_v1', JSON.stringify(favoriteTeams));
    } catch {}
  }, [favoriteTeams]);

  useEffect(() => {
    try {
      localStorage.setItem('flash_user_fav_leagues_v1', JSON.stringify(favoriteLeagues));
    } catch {}
  }, [favoriteLeagues]);

  const removeTeam = (team: string) => {
    setFavoriteTeams(prev => prev.filter(t => t !== team));
  };

  const removeLeague = (league: string) => {
    setFavoriteLeagues(prev => prev.filter(l => l !== league));
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newItemName.trim();
    if (!clean) return;

    if (activeTab === 'teams') {
      if (!favoriteTeams.some(t => t.toLowerCase() === clean.toLowerCase())) {
        setFavoriteTeams(prev => [...prev, clean]);
      }
    } else {
      if (!favoriteLeagues.some(l => l.toLowerCase() === clean.toLowerCase())) {
        setFavoriteLeagues(prev => [...prev, clean]);
      }
    }
    setNewItemName('');
  };

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
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Mes Favoris</h3>
              <p className="text-xs text-slate-500">Équipes, ligues et compétitions suivies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Équipes vs Ligues */}
        <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-slate-100 bg-slate-50/40">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-[#0066ff] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeTab === 'teams' ? 'fill-white' : ''}`} />
            <span>Équipes ({favoriteTeams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leagues')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'leagues'
                ? 'bg-[#0066ff] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Ligues ({favoriteLeagues.length})</span>
          </button>
        </div>

        {/* Add input */}
        <form onSubmit={addItem} className="p-3 border-b border-slate-100 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder={activeTab === 'teams' ? 'Ajouter une équipe (ex: Arsenal)' : 'Ajouter une ligue (ex: Serie A)'}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="px-3 py-2 rounded-xl bg-[#0066ff] text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Ajouter
            </button>
          </div>
        </form>

        {/* List */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {activeTab === 'teams' ? (
            favoriteTeams.length > 0 ? (
              favoriteTeams.map(team => (
                <div
                  key={team}
                  className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:border-blue-200 flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-amber-500 shrink-0">⭐</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">{team}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onFilterFavoriteMatches && (
                      <button
                        onClick={() => {
                          onFilterFavoriteMatches(team);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0066ff] text-[11px] font-bold transition-all cursor-pointer"
                        title="Voir les matchs de cette équipe"
                      >
                        Matchs
                      </button>
                    )}
                    <button
                      onClick={() => removeTeam(team)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Retirer des favoris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucune équipe favorite enregistrée.
              </div>
            )
          ) : favoriteLeagues.length > 0 ? (
            favoriteLeagues.map(league => (
              <div
                key={league}
                className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:border-blue-200 flex items-center justify-between gap-3 group transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-amber-500 shrink-0">🏆</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">{league}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onFilterFavoriteMatches && (
                    <button
                      onClick={() => {
                        onFilterFavoriteMatches(league);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0066ff] text-[11px] font-bold transition-all cursor-pointer"
                      title="Voir les matchs de cette ligue"
                    >
                      Matchs
                    </button>
                  )}
                  <button
                    onClick={() => removeLeague(league)}
                    className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Retirer des favoris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aucune ligue favorite enregistrée.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Accès rapide à vos préférences
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#0066ff] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
