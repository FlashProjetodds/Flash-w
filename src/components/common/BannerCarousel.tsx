import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  Zap,
  Gift,
  Rocket,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Flame,
  ArrowRight,
  Gamepad2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

// Local zero-data image assets bundled with Vite (0 KB mobile data consumed)
import soccerHeroImg from '../../assets/images/flash_soccer_action_1790462007046.jpg';
import analyticsHeroImg from '../../assets/images/flash_sports_analytics_1790794967582.jpg';
import arenaHeroImg from '../../assets/images/flash_basketball_arena_1790462017456.jpg';
import tennisHeroImg from '../../assets/images/flash_tennis_court_1790462027963.jpg';

export interface BannerSlide {
  id: string;
  badge: {
    text: string;
    icon: React.ReactNode;
    colorClasses: string;
  };
  titleTop: string;
  titleAccent: string;
  accentGradient: string;
  description: string;
  tags: { label: string; icon?: React.ReactNode; color?: string }[];
  ctaText: string;
  ctaAction: 'live' | 'gaming' | 'promos' | 'slip';
  image: string;
  overlayGradient: string;
}

export const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'championships',
    badge: {
      text: 'TOP COMPÉTITIONS MONDIALES',
      icon: <Trophy className="w-3.5 h-3.5 text-cyan-300" />,
      colorClasses: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    },
    titleTop: 'LES PLUS GRANDS',
    titleAccent: 'CHAMPIONNATS',
    accentGradient: 'from-[#00e5ff] via-[#38bdf8] to-[#60a5fa]',
    description:
      'Football, Basketball, Tennis : vivez l’intensité des plus grandes rencontres avec des cotes en temps réel sans latence.',
    tags: [
      { label: '⚽ Football (C1, PL, L1)', color: 'border-blue-400/40 text-blue-200' },
      { label: '🏀 Basketball (NBA)', color: 'border-indigo-400/40 text-indigo-200' },
      { label: '🎾 Tennis (Grands Chelems)', color: 'border-emerald-400/40 text-emerald-200' },
    ],
    ctaText: 'Parier en direct',
    ctaAction: 'live',
    image: soccerHeroImg,
    overlayGradient:
      'from-[#051329] via-[#071838]/90 sm:via-[#071838]/80 to-transparent',
  },
  {
    id: 'flash-week',
    badge: {
      text: 'OFFRE DE LA SEMAINE',
      icon: <Gift className="w-3.5 h-3.5 text-amber-300" />,
      colorClasses: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    },
    titleTop: 'FLASH',
    titleAccent: 'WEEK',
    accentGradient: 'from-[#fbbf24] via-[#f59e0b] to-[#00e5ff]',
    description:
      'Cashback et promotions de la semaine : jusqu’à 20% remboursés sur vos combinés et bonus exclusifs chaque jour !',
    tags: [
      { label: '💰 Cashback 20%', color: 'border-amber-400/40 text-amber-200' },
      { label: '⚡ Cotes Boostées', color: 'border-cyan-400/40 text-cyan-200' },
      { label: '🎁 Bonus Hebdomadaire', color: 'border-rose-400/40 text-rose-200' },
    ],
    ctaText: 'Profiter des bonus',
    ctaAction: 'promos',
    image: analyticsHeroImg,
    overlayGradient:
      'from-[#120e03] via-[#0f172a]/90 sm:via-[#0f172a]/80 to-transparent',
  },
  {
    id: 'gaming-section',
    badge: {
      text: 'SENSATIONS INSTANTANÉES',
      icon: <Gamepad2 className="w-3.5 h-3.5 text-fuchsia-300" />,
      colorClasses: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30',
    },
    titleTop: 'SECTION',
    titleAccent: 'GAMING',
    accentGradient: 'from-[#e879f9] via-[#c084fc] to-[#38bdf8]',
    description:
      'Crash games, Lucky Jet & Aviator : volez vers les sommets et multipliez vos mises en direct jusqu’à x100 !',
    tags: [
      { label: '🚀 Lucky Jet & Crash', color: 'border-fuchsia-400/40 text-fuchsia-200' },
      { label: '📈 Multiplicateurs x100', color: 'border-purple-400/40 text-purple-200' },
      { label: '🎯 Gains Instantanés', color: 'border-cyan-400/40 text-cyan-200' },
    ],
    ctaText: 'Jouer maintenant',
    ctaAction: 'gaming',
    image: arenaHeroImg,
    overlayGradient:
      'from-[#150728] via-[#0c1228]/90 sm:via-[#0c1228]/80 to-transparent',
  },
  {
    id: 'fast-and-reliable',
    badge: {
      text: '100% SÉCURISÉ & ÉCLAIR',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />,
      colorClasses: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    },
    titleTop: 'RAPIDE &',
    titleAccent: 'FIABLE',
    accentGradient: 'from-[#34d399] via-[#22d3ee] to-[#60a5fa]',
    description:
      'Cotes synchronisées en temps réel, validation ultra-rapide des tickets et transactions instantanées en FCFA.',
    tags: [
      { label: '⚡ 0 Latence Cotes', color: 'border-emerald-400/40 text-emerald-200' },
      { label: '🔒 Transactions Sécurisées', color: 'border-cyan-400/40 text-cyan-200' },
      { label: '⏱️ Retraits Express FCFA', color: 'border-teal-400/40 text-teal-200' },
    ],
    ctaText: 'Découvrir la vitesse',
    ctaAction: 'slip',
    image: tennisHeroImg,
    overlayGradient:
      'from-[#031d17] via-[#071838]/90 sm:via-[#071838]/80 to-transparent',
  },
];

interface BannerCarouselProps {
  onExplore?: (action?: string) => void;
  autoPlayInterval?: number;
  className?: string;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  onExplore,
  autoPlayInterval = 4000,
  className = '',
}) => {
  const { navigateTo } = useNavigation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch Swipe Gesture State
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const totalSlides = BANNER_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentIdx(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIdx(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIdx(index);
  }, []);

  // Strict 4-Second Auto-play Timer with automatic pause on interaction
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide, autoPlayInterval]);

  // Touch event handlers for tactile swipe left/right
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    isDraggingRef.current = true;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || touchStartXRef.current === null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - (touchStartYRef.current || touch.clientY);

    // If gesture is mostly horizontal, capture and visually respond
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      touchDeltaXRef.current = deltaX;
      // Damped tactile drag offset
      setDragOffset(deltaX * 0.4);
    }
  };

  const handleTouchEnd = () => {
    if (isDraggingRef.current) {
      const deltaX = touchDeltaXRef.current;
      const SWIPE_THRESHOLD = 45; // 45px swipe distance

      if (deltaX < -SWIPE_THRESHOLD) {
        nextSlide();
      } else if (deltaX > SWIPE_THRESHOLD) {
        prevSlide();
      }
    }

    // Reset touch state
    isDraggingRef.current = false;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;
    setDragOffset(0);

    // Resume auto-play after short delay
    setTimeout(() => {
      setIsPaused(false);
    }, 1200);
  };

  const handleActionClick = (slide: BannerSlide) => {
    if (onExplore) {
      onExplore(slide.ctaAction);
      return;
    }

    if (slide.ctaAction === 'gaming') {
      navigateTo('gaming');
    } else if (slide.ctaAction === 'live') {
      navigateTo('live');
    } else {
      navigateTo('home');
    }
  };

  return (
    <div
      className={`relative w-full max-w-full min-w-0 rounded-3xl overflow-hidden bg-[#071838] shadow-lg shadow-blue-950/20 min-h-[235px] sm:min-h-[255px] md:min-h-[280px] group select-none box-border border border-blue-200/40 dark:border-slate-800 transition-all ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Bannières promotionnelles FLASH"
    >
      {/* Zero Data Indicator (Hidden screen-reader attribute) */}
      <span className="sr-only">Bannière locale optimisée zéro donnée</span>

      {/* Track Container with Smooth CSS Transform Slide & Swipe */}
      <div
        className="flex w-full h-full min-h-[235px] sm:min-h-[255px] md:min-h-[280px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: `translateX(calc(-${currentIdx * 100}% + ${dragOffset}px))`,
        }}
      >
        {BANNER_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className="w-full shrink-0 relative min-h-[235px] sm:min-h-[255px] md:min-h-[280px] flex items-stretch"
            aria-hidden={idx !== currentIdx}
          >
            {/* Background Local Image (Loaded directly from bundle - 0 Ko network request) */}
            <img
              src={slide.image}
              alt={`${slide.titleTop} ${slide.titleAccent}`}
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-right sm:object-center transform scale-100 group-hover:scale-102 transition-transform duration-1000 ease-out"
            />

            {/* Contrast Gradient Overlays (Deep midnight blue scrim ensures pristine readability) */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${slide.overlayGradient}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071838] via-[#071838]/60 to-transparent sm:hidden" />

            {/* Decorative subtle ambient cyan corner glow */}
            <div className="absolute top-0 right-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Slide Content Box with generous bottom clearance for dots */}
            <div className="relative z-10 p-4 pb-7 sm:p-6 sm:pb-8 md:p-8 md:pb-8 flex flex-col justify-between w-full max-w-2xl">
              {/* Top Section: Badge + Title + Subtitle */}
              <div className="space-y-1.5 sm:space-y-2">
                {/* Modern Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider backdrop-blur-md border shadow-xs">
                  <span className={slide.badge.colorClasses.split(' ')[1]}>
                    {slide.badge.icon}
                  </span>
                  <span className="font-mono text-white/95">{slide.badge.text}</span>
                </div>

                {/* Big Impact Title */}
                <h2
                  className="text-xl sm:text-3xl md:text-4xl font-black italic tracking-tight uppercase leading-none drop-shadow-md pt-0.5"
                  style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
                >
                  <span className="text-white mr-2">{slide.titleTop}</span>
                  <span
                    className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.accentGradient} drop-shadow-[0_2px_14px_rgba(0,229,255,0.45)]`}
                  >
                    {slide.titleAccent}
                  </span>
                </h2>

                {/* Subtitle / Descriptive Copy */}
                <p className="text-xs sm:text-sm text-slate-200 dark:text-slate-100 font-medium leading-relaxed max-w-sm sm:max-w-md drop-shadow-sm pt-0.5 line-clamp-2 sm:line-clamp-none">
                  {slide.description}
                </p>
              </div>

              {/* Bottom Section: Feature Pills & CTA Button */}
              <div className="pt-2.5 sm:pt-4 flex flex-wrap items-center gap-1.5 sm:gap-2.5 mb-0.5 sm:mb-0">
                {/* Feature Tags */}
                {slide.tags.map((tag, tIdx) => (
                  <div
                    key={tIdx}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#091b36]/85 border ${
                      tag.color || 'border-blue-400/30 text-white'
                    } text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-xs`}
                  >
                    <span>{tag.label}</span>
                  </div>
                ))}

                {/* Action CTA Button */}
                <button
                  type="button"
                  onClick={() => handleActionClick(slide)}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#00d4ff] hover:from-[#0055ee] hover:to-[#00bcee] text-white text-[11px] sm:text-xs font-black shadow-md shadow-blue-500/30 transition-all active:scale-95 cursor-pointer ml-auto sm:ml-0"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Side Angled Floating Brand Badge (Desktop / Tablet) */}
            <div className="hidden lg:flex absolute right-6 bottom-7 z-10 items-center">
              <div className="transform -rotate-2 bg-gradient-to-r from-[#0052ff] to-[#0099ff] text-white font-black italic tracking-wide text-xs px-4 py-2 rounded-2xl shadow-xl shadow-blue-500/40 border border-white/20 backdrop-blur-sm flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300" />
                <span>FLASH • Le sport en temps réel</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pure Minimal Luminescent Pagination Dots (No background container box or border) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 pointer-events-auto select-none">
        {BANNER_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIdx;
          return (
            <button
              key={slide.id}
              onClick={() => goToSlide(idx)}
              aria-label={`Afficher la diapositive ${idx + 1} : ${slide.titleTop} ${slide.titleAccent}`}
              className="p-1 -m-1 transition-all duration-300 cursor-pointer focus:outline-none flex items-center justify-center bg-transparent border-none shadow-none"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-6 sm:w-7 h-1.5 bg-gradient-to-r from-[#00e5ff] via-[#38bdf8] to-[#0066ff] shadow-[0_0_10px_rgba(0,229,255,0.9)]'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80 hover:scale-125'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Desktop Chevron Navigation Controls */}
      <button
        onClick={prevSlide}
        aria-label="Diapositive précédente"
        className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/40 text-white/90 hover:text-white hover:bg-black/75 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md active:scale-95"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Diapositive suivante"
        className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-black/40 text-white/90 hover:text-white hover:bg-black/75 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md active:scale-95"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// Backward-compatible alias for existing imports
export { BannerCarousel as CarouselBanner };
