import React, { useState } from 'react';
import { SportsModal } from './SportsModal';
import { LeaguesModal, LeagueOption } from './LeaguesModal';
import { SPORT_LABELS, normalizeSportName } from '../../types/sports';
import { ChevronDown, X, Trophy } from 'lucide-react';

export type { LeagueOption };

interface SportsCategoriesBarProps {
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
  sportsCounts?: Record<string, number>;
  selectedLeague?: string;
  onSelectLeague?: (leagueId: string) => void;
  availableLeagues?: LeagueOption[];
}

// Custom crisp vector icons matching the mockup's 3D-styled sport balls
const SoccerBallIcon = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-9 sm:h-9 drop-shadow-sm" fill="none">
    <circle cx="20" cy="20" r="18" fill="url(#soccerGrad)" stroke="#0066ff" strokeWidth="1.5" />
    <defs>
      <radialGradient id="soccerGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#e2ecf8" />
        <stop offset="100%" stopColor="#b4d5fe" />
      </radialGradient>
    </defs>
    {/* Center pentagon */}
    <polygon points="20,13 26,17 24,24 16,24 14,17" fill="#0055ff" />
    {/* Seam lines to outer patches */}
    <line x1="20" y1="13" x2="20" y2="4" stroke="#0055ff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="26" y1="17" x2="34" y2="13" stroke="#0055ff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="24" y1="24" x2="32" y2="30" stroke="#0055ff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="24" x2="8" y2="30" stroke="#0055ff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="14" y1="17" x2="6" y2="13" stroke="#0055ff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BasketballIcon = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-9 sm:h-9 drop-shadow-sm" fill="none">
    <circle cx="20" cy="20" r="18" fill="url(#basketGrad)" stroke="#c2410c" strokeWidth="1.5" />
    <defs>
      <radialGradient id="basketGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="75%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#c2410c" />
      </radialGradient>
    </defs>
    <line x1="2" y1="20" x2="38" y2="20" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
    <line x1="20" y1="2" x2="20" y2="38" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
    <path d="M7 7 C 18 13, 18 27, 7 33" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" fill="none" />
    <path d="M33 7 C 22 13, 22 27, 33 33" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" fill="none" />
  </svg>
);

const TennisBallIcon = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-9 sm:h-9 drop-shadow-sm" fill="none">
    <circle cx="20" cy="20" r="18" fill="url(#tennisGrad)" stroke="#65a30d" strokeWidth="1.5" />
    <defs>
      <radialGradient id="tennisGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#facc15" />
        <stop offset="40%" stopColor="#bef264" />
        <stop offset="85%" stopColor="#84cc16" />
        <stop offset="100%" stopColor="#65a30d" />
      </radialGradient>
    </defs>
    <path d="M4 14 C 18 16, 26 24, 28 38" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M12 2 C 14 16, 22 24, 36 26" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const HandballIcon = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-9 sm:h-9 drop-shadow-sm" fill="none">
    <circle cx="20" cy="20" r="18" fill="url(#handballGrad)" stroke="#0284c7" strokeWidth="1.5" />
    <defs>
      <radialGradient id="handballGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="70%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </radialGradient>
    </defs>
    <circle cx="16" cy="16" r="6" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" fill="none" />
    <circle cx="25" cy="23" r="5" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" fill="none" />
    <circle cx="13" cy="27" r="4" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" fill="none" />
    <circle cx="27" cy="13" r="3.5" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" fill="none" />
  </svg>
);

const HockeyIcon = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-9 sm:h-9 drop-shadow-sm" fill="none">
    {/* Ice background circle */}
    <circle cx="20" cy="20" r="18" fill="url(#iceGrad)" stroke="#38bdf8" strokeWidth="1" />
    <defs>
      <radialGradient id="iceGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#f0f9ff" />
        <stop offset="100%" stopColor="#e0f2fe" />
      </radialGradient>
    </defs>
    {/* Hockey Stick */}
    <path
      d="M12 8 L24 26 L32 28 C33 28, 33 26, 31 25 L25 24 L14 7 Z"
      fill="#0284c7"
      stroke="#0369a1"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    {/* Puck */}
    <ellipse cx="27" cy="31" rx="5" ry="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
  </svg>
);

const PlusGridIcon = () => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 sm:w-8 sm:h-8" fill="none">
    <circle cx="12" cy="12" r="3" fill="#0066ff" />
    <circle cx="20" cy="12" r="3" fill="#0066ff" />
    <circle cx="28" cy="12" r="3" fill="#0066ff" />
    <circle cx="12" cy="20" r="3" fill="#0066ff" />
    <circle cx="20" cy="20" r="3" fill="#0066ff" />
    <circle cx="28" cy="20" r="3" fill="#0066ff" />
    <circle cx="12" cy="28" r="3" fill="#0066ff" />
    <circle cx="20" cy="28" r="3" fill="#0066ff" />
    <circle cx="28" cy="28" r="3" fill="#0066ff" />
  </svg>
);

export const SportsCategoriesBar: React.FC<SportsCategoriesBarProps> = ({
  selectedSport,
  onSelectSport,
  sportsCounts = {},
  selectedLeague = 'all',
  onSelectLeague,
  availableLeagues = [],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeaguesModalOpen, setIsLeaguesModalOpen] = useState(false);

  // The 5 fixed primary sports from the mockup
  const sportsList = [
    { id: 'football', name: 'Football', icon: <SoccerBallIcon /> },
    { id: 'basketball', name: 'Basketball', icon: <BasketballIcon /> },
    { id: 'tennis', name: 'Tennis', icon: <TennisBallIcon /> },
    { id: 'handball', name: 'Handball', icon: <HandballIcon /> },
    { id: 'hockey', name: 'Hockey', icon: <HockeyIcon /> },
  ];

  // Check if active sport is a secondary one (selected from modal)
  const isSelectedSecondary =
    selectedSport !== 'all' && !sportsList.some(s => s.id === selectedSport);

  const getSecondaryLabel = () => {
    if (!isSelectedSecondary) return 'Plus';
    const norm = normalizeSportName(selectedSport);
    return SPORT_LABELS[norm] || selectedSport;
  };

  const currentSportName = selectedSport === 'all'
    ? 'Tous les sports'
    : sportsList.find(s => s.id === selectedSport)?.name || getSecondaryLabel();

  return (
    <>
      <div className="w-full max-w-full min-w-0 box-border bg-white/70 dark:bg-[#071838]/70 backdrop-blur-xs rounded-3xl p-2.5 sm:p-3 border border-[#d9ebfc] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,102,255,0.03)] space-y-2">
        {/* 6 category items matching the mockup */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 w-full max-w-full min-w-0 box-border">
          
          {sportsList.map(sport => {
            const isSelected = selectedSport === sport.id;
            const normId = normalizeSportName(sport.id);
            const rawCount = sportsCounts[sport.id] ?? sportsCounts[normId] ?? sportsCounts[sport.name.toLowerCase()];
            const countDisplay = typeof rawCount === 'number' && rawCount > 0 ? rawCount : 0;

            return (
              <button
                key={sport.id}
                onClick={() => {
                  onSelectSport(isSelected ? 'all' : sport.id);
                }}
                className={`w-full min-w-0 py-2 sm:py-3 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 box-border ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950 border-2 border-[#0066ff] shadow-md shadow-blue-500/15'
                    : 'bg-white dark:bg-[#071838] hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#cde3fb] dark:border-slate-800 shadow-[0_2px_8px_rgba(0,102,255,0.03)]'
                }`}
                title={sport.name}
              >
                {/* Icon wrapper with count badge */}
                <div className="relative flex items-center justify-center mb-1">
                  {sport.icon}
                  {/* Circular electric blue count badge (displayed only if count > 0) */}
                  {countDisplay > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#0066ff] text-white text-[9px] sm:text-[10px] font-black px-1 rounded-full min-w-[15px] sm:min-w-[17px] h-[15px] sm:h-[17px] flex items-center justify-center border-2 border-white shadow-xs">
                      {countDisplay}
                    </span>
                  )}
                </div>

                {/* Sport label */}
                <span
                  className={`text-[10px] sm:text-xs tracking-tight truncate max-w-full text-center block ${
                    isSelected ? 'text-[#0066ff] dark:text-blue-400 font-black' : 'text-[#071838] dark:text-slate-100 font-bold'
                  }`}
                >
                  {sport.name}
                </span>
              </button>
            );
          })}

          {/* 6th item: ▦ Plus button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className={`w-full min-w-0 py-2 sm:py-3 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 box-border ${
              isSelectedSecondary
                ? 'bg-blue-50/80 border-2 border-[#0066ff] shadow-md shadow-blue-500/15'
                : 'bg-white hover:bg-slate-50 border border-[#cde3fb] shadow-[0_2px_8px_rgba(0,102,255,0.03)]'
            }`}
            title="Plus de sports"
          >
            {/* 9-dots icon */}
            <div className="relative flex items-center justify-center mb-1">
              <PlusGridIcon />
            </div>

            {/* Label */}
            <span
              className={`text-[10px] sm:text-xs tracking-tight truncate max-w-full text-center block ${
                isSelectedSecondary ? 'text-[#0066ff] dark:text-blue-400 font-black capitalize' : 'text-[#071838] dark:text-slate-100 font-bold'
              }`}
            >
              {getSecondaryLabel()}
            </span>
          </button>

        </div>

        {/* Option de filtrage par ligue / championnat */}
        {availableLeagues && availableLeagues.length > 0 && onSelectLeague && (
          <div className="w-full pt-2 border-t border-blue-100/70 flex items-center gap-1.5 min-w-0">
            {/* Bouton d'accès au catalogue complet des ligues */}
            <button
              onClick={() => setIsLeaguesModalOpen(true)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50/90 hover:bg-blue-100 text-[#0066ff] border border-blue-200/70 text-[11px] font-bold transition-all shadow-2xs group cursor-pointer"
              title="Ouvrir toutes les compétitions"
            >
              <Trophy className="w-3.5 h-3.5 text-[#0066ff]" />
              <span className="hidden sm:inline">Ligues</span>
              <span className="bg-[#0066ff] text-white text-[9px] font-mono px-1 rounded-full font-black min-w-[16px] text-center">
                {availableLeagues.length}
              </span>
              <ChevronDown className="w-3 h-3 text-[#0066ff] group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Défilement horizontal des compétitions phares */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
              {/* Option: Toutes */}
              <button
                onClick={() => onSelectLeague('all')}
                className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer select-none ${
                  selectedLeague === 'all'
                    ? 'bg-[#0066ff] text-white shadow-xs shadow-blue-500/20'
                    : 'bg-white dark:bg-[#0b1222] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-[#cde3fb] dark:border-slate-800'
                }`}
              >
                Toutes
              </button>

              {/* Pilules des ligues disponibles */}
              {availableLeagues.slice(0, 10).map(league => {
                const isSelected = selectedLeague.toLowerCase() === league.id.toLowerCase();
                return (
                  <button
                    key={league.id}
                    onClick={() => onSelectLeague(isSelected ? 'all' : league.id)}
                    className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#0066ff] text-white font-bold shadow-xs shadow-blue-500/20 ring-1 ring-[#0066ff]'
                        : 'bg-white dark:bg-[#0b1222] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-[#cde3fb] dark:border-slate-800'
                    }`}
                    title={league.name}
                  >
                    <span className="truncate max-w-[130px] sm:max-w-[180px]">{league.name}</span>
                    <span
                      className={`text-[9px] font-mono px-1 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {league.count}
                    </span>
                    {isSelected && (
                      <span
                        onClick={e => {
                          e.stopPropagation();
                          onSelectLeague('all');
                        }}
                        className="hover:bg-white/20 rounded-full p-0.5 ml-0.5"
                      >
                        <X className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Raccourci vers la liste complète si plus de 10 ligues */}
              {availableLeagues.length > 10 && (
                <button
                  onClick={() => setIsLeaguesModalOpen(true)}
                  className="shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-[#0066ff] hover:text-blue-700 bg-blue-50/60 hover:bg-blue-50 border border-blue-200/60 transition-all cursor-pointer whitespace-nowrap"
                >
                  +{availableLeagues.length - 10} autres...
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sports selection dialog */}
      <SportsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedSport={selectedSport}
        onSelectSport={onSelectSport}
        sportsCounts={sportsCounts}
      />

      {/* Leagues selection dialog */}
      {availableLeagues && onSelectLeague && (
        <LeaguesModal
          isOpen={isLeaguesModalOpen}
          onClose={() => setIsLeaguesModalOpen(false)}
          selectedLeague={selectedLeague}
          onSelectLeague={onSelectLeague}
          leagues={availableLeagues}
          sportName={currentSportName}
        />
      )}
    </>
  );
};
