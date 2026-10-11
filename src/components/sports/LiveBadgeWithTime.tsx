import React, { useState, useEffect } from 'react';
import { SportEvent } from '../../types';
import { getValidElapsedTime } from '../../utils/time';
import { Clock } from 'lucide-react';

interface LiveBadgeWithTimeProps {
  event: SportEvent;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Composant officiel Flash :
 * Affiche le badge rouge "● LIVE" et immédiatement à sa droite, sur la même ligne,
 * un petit indicateur bleu discret du temps écoulé réel (ex: "🕒 21'").
 */
export const LiveBadgeWithTime: React.FC<LiveBadgeWithTimeProps> = ({
  event,
  size = 'md',
  className = '',
}) => {
  // État local pour rafraîchir le temps écoulé de manière fluide sans recharger la page
  const [, setTick] = useState(0);

  useEffect(() => {
    let isMounted = true;
    // Si l'événement est en direct, rafraîchir toutes les 30 secondes pour un temps réel précis
    if (event.status === 'live') {
      const interval = setInterval(() => {
        if (isMounted) {
          setTick(t => t + 1);
        }
      }, 30000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [event.status, event.startTime]);

  const elapsedTime = getValidElapsedTime(event);

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs sm:text-sm px-2.5 sm:px-3 py-1 gap-1.5',
  }[size];

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
    lg: 'w-3 h-3 sm:w-3.5 sm:h-3.5',
  }[size];

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 shrink-0 select-none ${className}`}>
      {/* 1. Badge LIVE (Rose/Rouge avec point lumineux animé) */}
      <div
        className={`inline-flex items-center ${sizeClasses} rounded-full bg-rose-50 text-[#ff003b] border border-rose-200/80 font-black font-mono shadow-xs shrink-0`}
        aria-label="En direct"
      >
        <span className="relative flex shrink-0 items-center justify-center">
          <span className={`absolute ${dotSizes} rounded-full bg-[#ff003b] animate-ping opacity-75`} />
          <span className={`relative ${dotSizes} rounded-full bg-[#ff003b]`} />
        </span>
        <span className="tracking-wider">LIVE</span>
      </div>

      {/* 2. Indicateur de temps écoulé à côté de LIVE (Bleu discret, icône horloge) */}
      {elapsedTime && (
        <div
          className={`inline-flex items-center ${sizeClasses} rounded-full bg-blue-50/80 text-[#0066ff] border border-blue-200/70 font-bold font-mono shadow-xs shrink-0 whitespace-nowrap`}
          title={`Temps écoulé : ${elapsedTime}`}
        >
          <Clock className={`${iconSizes} text-[#0066ff] shrink-0`} />
          <span>{elapsedTime}</span>
        </div>
      )}
    </div>
  );
};
