import React, { useState, useEffect } from 'react';
import { Team } from '../../types';
import { getTeamInitials, generateTeamBadgeSvg, POPULAR_TEAM_LOGOS } from '../../utils/logo';

export { getTeamInitials };

interface TeamLogoProps {
  team: Team;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ team, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state if team identity or logo source changes
  useEffect(() => {
    setImgError(false);
  }, [team.logo, team.name]);

  // Size variations
  const sizeClasses = {
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-9 h-9 sm:w-10 sm:h-10 text-[10px]',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 text-xs',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 text-sm',
  }[size];

  const hasDirectLogo =
    team.logo &&
    !imgError &&
    team.logo.trim() !== '' &&
    !team.logo.includes('equipe-logodefaut');

  // Fallback chain: Direct Logo -> Popular Team Logo Database -> Dynamic Sports SVG Badge
  let logoSource = hasDirectLogo ? team.logo! : undefined;

  if (!logoSource) {
    const normalizedKey = team.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const popularUrl = POPULAR_TEAM_LOGOS[normalizedKey];
    if (popularUrl) {
      logoSource = popularUrl;
    } else {
      logoSource = generateTeamBadgeSvg(team.name);
    }
  }

  return (
    <div
      className={`${sizeClasses} shrink-0 flex items-center justify-center rounded-xl bg-white border border-slate-200/80 p-1 shadow-xs overflow-hidden transition-transform select-none ${className}`}
      title={team.name}
    >
      <img
        src={logoSource}
        alt={`Logo ${team.name}`}
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
