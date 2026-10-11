import React from 'react';
import { Zap, Calendar, CalendarDays, CheckCircle2 } from 'lucide-react';

export type TimeTab = 'live' | 'today' | 'upcoming' | 'finished';

interface TimeTabsProps {
  activeTab: TimeTab;
  onSelectTab: (tab: TimeTab) => void;
  counts: {
    live: number;
    today: number;
    upcoming: number;
    finished?: number;
  };
}

export const TimeTabs: React.FC<TimeTabsProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  return (
    <div className="w-full max-w-full min-w-0 space-y-3.5 sm:space-y-4 box-border">
      {/* 4 Prominent Navigation Pills with Icons matching mockup */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full max-w-full min-w-0 box-border">
        
        {/* 1. DIRECT ⚡ */}
        <button
          onClick={() => onSelectTab('live')}
          className={`min-h-[44px] sm:min-h-[48px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer min-w-0 ${
            activeTab === 'live'
              ? 'bg-gradient-to-r from-[#0055ff] to-[#0099ff] text-white shadow-md shadow-blue-500/30'
              : 'bg-white dark:bg-[#0b1222] hover:bg-blue-50/50 dark:hover:bg-slate-800 text-[#0066ff] dark:text-sky-300 border border-[#cde3fb] dark:border-slate-800 shadow-xs'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'live' ? 'text-white' : 'text-[#0066ff] dark:text-sky-300'}`} />
          <span className="truncate">Direct</span>
        </button>

        {/* 2. AUJOURD'HUI 📅 */}
        <button
          onClick={() => onSelectTab('today')}
          className={`min-h-[44px] sm:min-h-[48px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer min-w-0 ${
            activeTab === 'today'
              ? 'bg-gradient-to-r from-[#0055ff] to-[#0099ff] text-white shadow-md shadow-blue-500/30'
              : 'bg-white dark:bg-[#0b1222] hover:bg-blue-50/50 dark:hover:bg-slate-800 text-[#0066ff] dark:text-sky-300 border border-[#cde3fb] dark:border-slate-800 shadow-xs'
          }`}
        >
          <Calendar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'today' ? 'text-white' : 'text-[#0066ff] dark:text-sky-300'}`} />
          <span className="truncate">Aujourd'hui</span>
        </button>

        {/* 3. À VENIR 🗓 */}
        <button
          onClick={() => onSelectTab('upcoming')}
          className={`min-h-[44px] sm:min-h-[48px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer min-w-0 ${
            activeTab === 'upcoming'
              ? 'bg-gradient-to-r from-[#0055ff] to-[#0099ff] text-white shadow-md shadow-blue-500/30'
              : 'bg-white dark:bg-[#0b1222] hover:bg-blue-50/50 dark:hover:bg-slate-800 text-[#0066ff] dark:text-sky-300 border border-[#cde3fb] dark:border-slate-800 shadow-xs'
          }`}
        >
          <CalendarDays className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'upcoming' ? 'text-white' : 'text-[#0066ff] dark:text-sky-300'}`} />
          <span className="truncate">À venir</span>
        </button>

        {/* 4. TERMINÉE ✓ */}
        <button
          onClick={() => onSelectTab('finished')}
          className={`min-h-[44px] sm:min-h-[48px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer min-w-0 ${
            activeTab === 'finished'
              ? 'bg-gradient-to-r from-[#0055ff] to-[#0099ff] text-white shadow-md shadow-blue-500/30'
              : 'bg-white dark:bg-[#0b1222] hover:bg-blue-50/50 dark:hover:bg-slate-800 text-[#0066ff] dark:text-sky-300 border border-[#cde3fb] dark:border-slate-800 shadow-xs'
          }`}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'finished' ? 'text-white' : 'text-[#0066ff] dark:text-sky-300'}`} />
          <span className="truncate">Terminée</span>
        </button>

      </div>

      {/* Section Sub-heading matching Mockup */}
      <div className="flex items-center justify-between px-1 pt-1">
        {activeTab === 'live' && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff003b] animate-pulse shadow-sm shadow-red-500/40" />
              <h3 className="text-base sm:text-xl font-black text-[#071838] dark:text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Matchs en direct
              </h3>
            </div>
            <span className="px-3 py-0.5 rounded-full bg-[#ff003b] text-white text-xs sm:text-sm font-black font-mono shadow-sm shadow-red-500/30 tabular-nums">
              {counts.live}
            </span>
          </>
        )}

        {activeTab === 'today' && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0066ff] shadow-sm shadow-blue-500/40" />
              <h3 className="text-base sm:text-xl font-black text-[#071838] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Matchs d'aujourd'hui
              </h3>
            </div>
            <span className="px-3 py-0.5 rounded-full bg-[#0066ff] text-white text-xs sm:text-sm font-black font-mono shadow-sm shadow-blue-500/30 tabular-nums">
              {counts.today}
            </span>
          </>
        )}

        {activeTab === 'upcoming' && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
              <h3 className="text-base sm:text-xl font-black text-[#071838] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Matchs à venir
              </h3>
            </div>
            <span className="px-3 py-0.5 rounded-full bg-[#0284c7] text-white text-xs sm:text-sm font-black font-mono shadow-sm tabular-nums">
              {counts.upcoming}
            </span>
          </>
        )}

        {activeTab === 'finished' && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-500" />
              <h3 className="text-base sm:text-xl font-black text-[#071838] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Matchs terminés
              </h3>
            </div>
            <span className="px-3 py-0.5 rounded-full bg-slate-500 text-white text-xs sm:text-sm font-black font-mono shadow-sm tabular-nums">
              {counts.finished || 0}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
