import React from 'react';

export const SplashScreen: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#071838] transition-opacity duration-1000 ease-in-out select-none ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Particles background effect (particules lumineuses étoilées discrètes) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(35)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20 animate-pulse"
            style={{
              width: `${(i % 3) + 1.5}px`,
              height: `${(i % 3) + 1.5}px`,
              top: `${((i * 19) % 94) + 3}%`,
              left: `${((i * 29) % 94) + 3}%`,
              animationDelay: `${(i * 0.25) % 3.5}s`,
              animationDuration: `${2.2 + (i % 3)}s`,
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.7)',
            }}
          />
        ))}
      </div>

      {/* Main Title and Slogan - Perfectly Centered, No Logo */}
      <div className="flex flex-col items-center text-center z-10 px-4">
        {/* Title: "FL" in bright pure white, "ASH" in metallic grayish-blue with textured shimmer */}
        <h1
          className="text-6xl sm:text-7xl font-black italic tracking-tighter uppercase leading-none select-none"
          style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
        >
          <span className="text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.7)]">
            FL
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-200 via-sky-200 to-slate-400 drop-shadow-[0_0_20px_rgba(186,230,253,0.55)] animate-pulse">
            ASH
          </span>
        </h1>

        {/* Subtitle: "LE SPORT EN TEMPS RÉEL" in pure white, clean & legible */}
        <p
          className="text-white uppercase tracking-[0.28em] text-xs sm:text-sm font-bold mt-3.5 drop-shadow-sm opacity-95"
          style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
        >
          LE SPORT EN TEMPS RÉEL
        </p>
      </div>
    </div>
  );
};
