import React from 'react';

export interface ScoreData {
  home: number | string;
  away: number | string;
  detail?: string;
}

interface MatchScoreProps {
  score?: ScoreData | null;
  status?: string;
  isLive?: boolean;
  isFinished?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Sanitizes score detail to strictly prevent secondary scores from duplicating the main score.
 * E.g., removes redundant "0:0", "1:0", "0-0", "(0:0)" or exact matches of the home/away figures.
 * Preserves genuinely distinct sport data such as tennis set progression (6-4, 3-2),
 * basketball quarters (Q1: 24-20), or cricket overs (20.0 ov).
 */
export function getDistinctScoreDetail(
  detail: string | undefined | null,
  homeStr: string,
  awayStr: string
): string {
  if (!detail) return '';
  let d = String(detail).trim();
  if (!d) return '';

  // Clean leading labels (sets:, score:, details:, etc.)
  d = d.replace(/^(sets?|scores?|détails?|details?)\s*:\s*/i, '').trim();

  // Normalized version without whitespace and in lowercase
  const normalizedD = d.replace(/\s+/g, '').toLowerCase();
  const directScoreColon = `${homeStr}:${awayStr}`.toLowerCase();
  const directScoreDash = `${homeStr}-${awayStr}`.toLowerCase();
  const reverseScoreColon = `${awayStr}:${homeStr}`.toLowerCase();
  const reverseScoreDash = `${awayStr}-${homeStr}`.toLowerCase();

  // 1. Direct duplicate matches (e.g. "0:0", "0-0", "1:0", "1-0", "(0:0)", "(1-0)")
  if (
    normalizedD === directScoreColon ||
    normalizedD === directScoreDash ||
    normalizedD === reverseScoreColon ||
    normalizedD === reverseScoreDash ||
    normalizedD === `(${directScoreColon})` ||
    normalizedD === `(${directScoreDash})`
  ) {
    return '';
  }

  // 2. Exact pair of digits like "0:0", "1:0", "2:1" matching the primary score
  const pairMatch = normalizedD.match(/^(\d+)[:\-](\d+)$/);
  if (pairMatch) {
    const [, h, a] = pairMatch;
    if (h === homeStr && a === awayStr) {
      return '';
    }
    // Also if numeric values equal home and away
    const hNum = parseInt(homeStr, 10);
    const aNum = parseInt(awayStr, 10);
    const hPair = parseInt(h, 10);
    const aPair = parseInt(a, 10);
    if (!isNaN(hNum) && !isNaN(aNum) && hNum === hPair && aNum === aPair) {
      return '';
    }
  }

  // 3. Repeated identical pairs like "0:0(0:0)" or "0:0,0:0"
  if (
    normalizedD === `${directScoreColon}(${directScoreColon})` ||
    normalizedD === `${directScoreColon},${directScoreColon}` ||
    normalizedD === `${directScoreDash},${directScoreDash}`
  ) {
    return '';
  }

  // 4. Redundant zeros like "0:0" or "0-0"
  if (
    normalizedD === '0:0' ||
    normalizedD === '0-0' ||
    normalizedD === '(0:0)' ||
    normalizedD === '(0-0)'
  ) {
    return '';
  }

  // 5. Clean up display formatting for valid distinct details (sets, periods, overs)
  let cleaned = d.replace(/set\s*\d+\s*:\s*/gi, '');
  return cleaned.trim();
}

/**
 * Universal Single-Line Match Score Component
 * Enforces strict horizontal alignment across all sports (football, basketball, cricket, tennis, etc.)
 * Adapts typography and padding proportionally without wrapping or breaking vertically.
 */
export const MatchScore: React.FC<MatchScoreProps> = ({
  score,
  status,
  isLive = false,
  isFinished = false,
  size = 'md',
  className = '',
}) => {
  // If no score exists or event is pre-match without score, display standard VS pill
  if (!score || (score.home === undefined && score.away === undefined)) {
    return (
      <div
        className={`inline-flex items-center justify-center font-black font-mono rounded-full bg-[#eef6ff] dark:bg-slate-900 border border-blue-200/60 dark:border-slate-800 text-[#0066ff] dark:text-blue-400 whitespace-nowrap shrink-0 select-none ${
          size === 'lg'
            ? 'px-4 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base'
            : 'px-3 sm:px-4 py-1 text-xs sm:text-sm'
        } ${className}`}
      >
        VS
      </div>
    );
  }

  const homeStr = String(score.home ?? 0).trim();
  const awayStr = String(score.away ?? 0).trim();
  const totalLen = homeStr.length + awayStr.length;

  // Determine dynamic font scaling based on size and text length (e.g. cricket overs / sets)
  let textAndPaddingClass = '';
  if (size === 'lg') {
    if (totalLen <= 4) {
      // Short scores like 2 - 1 or 0 - 0
      textAndPaddingClass = 'text-2xl sm:text-4xl px-4 sm:px-6 py-1.5 sm:py-2 tracking-wider';
    } else if (totalLen <= 8) {
      // Medium scores like 112 - 108 (basketball) or 24 - 18
      textAndPaddingClass = 'text-xl sm:text-2xl px-3.5 sm:px-5 py-1.5 sm:py-2 tracking-wide';
    } else {
      // Long scores like cricket (e.g. 185/4 - 142/8) or tennis sets
      textAndPaddingClass = 'text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-1.5 tracking-normal';
    }
  } else {
    // 'sm' or 'md' (Card views)
    if (totalLen <= 4) {
      textAndPaddingClass = 'text-base sm:text-xl px-3.5 sm:px-5 py-0.5 sm:py-1 tracking-wider';
    } else if (totalLen <= 8) {
      textAndPaddingClass = 'text-xs sm:text-sm px-2.5 sm:px-3.5 py-0.5 sm:py-1 tracking-wide';
    } else {
      textAndPaddingClass = 'text-[11px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 tracking-normal';
    }
  }

  // Standard clean theme styling based on live/finished state (clean, fixed, and legible)
  const bgClass =
    isLive || status === 'live'
      ? 'bg-gradient-to-r from-[#0055ff] to-[#0099ff] text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
      : isFinished || status === 'finished'
      ? 'bg-[#071838] dark:bg-slate-900 text-white shadow-xs border border-slate-700/40 dark:border-slate-800'
      : 'bg-white dark:bg-slate-900 text-[#071838] dark:text-slate-100 border border-[#cde3fb] dark:border-slate-800 shadow-xs';

  // Strictly filter duplicate or redundant secondary scores
  const distinctDetail = React.useMemo(() => {
    return getDistinctScoreDetail(score?.detail, homeStr, awayStr);
  }, [score?.detail, homeStr, awayStr]);

  return (
    <div className="flex flex-col items-center justify-center shrink-0 relative">
      <div
        className={`score inline-flex flex-row items-center justify-center whitespace-nowrap rounded-full font-black font-mono select-none shrink-0 ${bgClass} ${textAndPaddingClass} ${className}`}
        style={{ whiteSpace: 'nowrap' }}
      >
        <span className="home-score inline-flex items-center justify-center whitespace-nowrap shrink-0 tabular-nums leading-none">
          {homeStr}
        </span>
        <span
          className="separator inline-flex items-center justify-center whitespace-nowrap shrink-0 mx-1 sm:mx-1.5 opacity-80 select-none leading-none"
          aria-hidden="true"
        >
          -
        </span>
        <span className="away-score inline-flex items-center justify-center whitespace-nowrap shrink-0 tabular-nums leading-none">
          {awayStr}
        </span>
      </div>

      {/* Render secondary badge ONLY when genuinely distinct information exists (e.g. tennis sets or cricket overs) */}
      {distinctDetail && (
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 rounded-full mt-1 whitespace-nowrap shrink-0 select-none">
          {distinctDetail}
        </span>
      )}
    </div>
  );
};
