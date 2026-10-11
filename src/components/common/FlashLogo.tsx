import React from 'react';

interface FlashLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  className?: string;
  onClick?: () => void;
}

export const FlashLogo: React.FC<FlashLogoProps> = ({
  size = 'md',
  showSlogan = true,
  className = '',
  onClick,
}) => {
  // Dimensions and scale factors
  const dimensions = {
    sm: { height: 32, boltW: 24, boltH: 30, textClass: 'text-xl', sloganClass: 'text-[7px]' },
    md: { height: 42, boltW: 32, boltH: 40, textClass: 'text-2xl sm:text-3xl', sloganClass: 'text-[8.5px] sm:text-[9.5px]' },
    lg: { height: 54, boltW: 42, boltH: 52, textClass: 'text-4xl sm:text-5xl', sloganClass: 'text-[11px] sm:text-[12px]' },
    xl: { height: 68, boltW: 52, boltH: 64, textClass: 'text-5xl sm:text-6xl', sloganClass: 'text-[13px] sm:text-[14px]' },
  }[size];

  const content = (
    <div
      className={`inline-flex items-center gap-2 sm:gap-2.5 select-none transition-transform active:scale-98 bg-transparent ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* ⚡ Dynamic Electric Blue Lightning Bolt SVG - Clean, seamlessly melted into header without any background box or halo */}
      <div className="relative shrink-0 flex items-center justify-center bg-transparent">
        <svg
          width={dimensions.boltW}
          height={dimensions.boltH}
          viewBox="0 0 48 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="flashBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="45%" stopColor="#0072ff" />
              <stop offset="100%" stopColor="#0044ff" />
            </linearGradient>
            <linearGradient id="flashBoltInner" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#00e5ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0052ff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Main Electric Bolt Polygon */}
          <polygon
            points="28,2 6,32 24,32 18,58 44,22 26,22"
            fill="url(#flashBoltGrad)"
          />

          {/* Core Speed Highlight */}
          <polygon
            points="26,6 12,30 24,30 20,50 38,24 24,24"
            fill="url(#flashBoltInner)"
          />
        </svg>
      </div>

      {/* Brand Typography: FLASH + Slogan */}
      <div className="flex flex-col justify-center leading-none">
        {/* "FLASH" Wordmark: Thick, Sporty, Slanted, Midnight Blue in Light, Crisp White in Dark */}
        <span
          className={`font-black italic tracking-tighter uppercase text-[#071838] dark:text-white leading-none transition-colors duration-200 ${dimensions.textClass}`}
          style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            letterSpacing: '-0.04em',
            transform: 'skewX(-6deg)',
          }}
        >
          FLASH
        </span>

        {/* Slogan: "LE SPORT EN TEMPS RÉEL" */}
        {showSlogan && (
          <span
            className={`font-black uppercase tracking-[0.2em] text-[#0066ff] dark:text-slate-300 leading-tight mt-0.5 sm:mt-1 transition-colors duration-200 ${dimensions.sloganClass}`}
            style={{
              fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.18em',
            }}
          >
            LE SPORT EN TEMPS RÉEL
          </span>
        )}
      </div>
    </div>
  );

  return content;
};
