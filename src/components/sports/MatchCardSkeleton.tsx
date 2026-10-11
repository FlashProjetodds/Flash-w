import React from 'react';

interface MatchCardSkeletonProps {
  className?: string;
}

/**
 * Custom skeleton loader matching the exact geometry, rounded borders,
 * header, teams, score, and odds button structure of MatchCard.
 */
export const MatchCardSkeleton: React.FC<MatchCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-[#e0edfb] dark:border-slate-800 shadow-[0_2px_12px_rgba(0,102,255,0.04)] w-full max-w-full min-w-0 box-border overflow-hidden select-none animate-shimmer relative ${className}`}
      aria-hidden="true"
    >
      {/* 1. Header: Competition name + Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-2 text-xs min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="w-4 h-4 rounded-full bg-slate-200/80 dark:bg-slate-800 shrink-0" />
          <div className="h-3.5 sm:h-4 w-28 sm:w-36 rounded-md bg-slate-200/70 dark:bg-slate-800" />
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <div className="h-5 sm:h-5.5 w-12 sm:w-14 rounded-full bg-rose-50/80 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/60" />
          <div className="h-5 sm:h-5.5 w-10 sm:w-12 rounded-full bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60" />
        </div>
      </div>

      {/* 2. Teams & Score Line (Strict 3-column layout matching MatchCard) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-1 mb-2.5 w-full min-w-0">
        {/* Home Team (Left) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shrink-0" />
          <div className="h-3.5 sm:h-4 w-18 sm:w-28 rounded-md bg-slate-200/80 dark:bg-slate-800 truncate" />
        </div>

        {/* Score Pill / VS (Center) */}
        <div className="flex flex-col items-center justify-center text-center px-1 shrink-0">
          <div className="h-7 sm:h-8 w-12 sm:w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700" />
        </div>

        {/* Away Team (Right) */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0 text-right">
          <div className="h-3.5 sm:h-4 w-18 sm:w-28 rounded-md bg-slate-200/80 dark:bg-slate-800 truncate ml-auto" />
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shrink-0" />
        </div>
      </div>

      {/* 3. Odds Buttons Row (1X2) underneath */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2.5 border-t border-blue-100/60 dark:border-slate-800 w-full max-w-full min-w-0 box-border">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="h-11 sm:h-12 rounded-xl bg-[#f8fbff] dark:bg-slate-900 border border-[#cde3fb] dark:border-slate-800 p-1.5 sm:p-2 flex flex-col items-center justify-center gap-1 min-w-0 box-border"
          >
            <div className="h-2 w-3.5 rounded bg-slate-200/70 dark:bg-slate-800" />
            <div className="h-3 sm:h-3.5 w-8 rounded-md bg-blue-100/70 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
};

interface MatchCardSkeletonGridProps {
  count?: number;
  className?: string;
}

/**
 * Grid of custom MatchCard skeleton loaders matching the exact responsive grid layout of the app.
 */
export const MatchCardSkeletonGrid: React.FC<MatchCardSkeletonGridProps> = ({
  count = 4,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
};
