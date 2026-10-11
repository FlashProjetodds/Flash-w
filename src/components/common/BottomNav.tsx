import React from 'react';
import { Home, Radio, CalendarCheck, Gamepad2, Menu } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  onRequireAuth: () => void;
  onOpenMenu?: () => void;
  isMenuOpen?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onRequireAuth,
  onOpenMenu,
  isMenuOpen = false,
}) => {
  const { currentView, navigateTo } = useNavigation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#071838]/95 backdrop-blur-xl border-t border-[#cde3fb] dark:border-slate-800 pb-safe shadow-[0_-4px_20px_rgba(0,102,255,0.06)]">
      <nav className="max-w-md sm:max-w-2xl mx-auto grid grid-cols-5 items-center h-16 sm:h-18 px-1">
        
        {/* 1. 🏠 Accueil */}
        <button
          onClick={() => navigateTo('home')}
          className={`min-h-[50px] flex flex-col items-center justify-center transition-all cursor-pointer ${
            currentView === 'home'
              ? 'text-[#0066ff] dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-400 hover:text-[#0066ff] dark:hover:text-blue-400'
          }`}
        >
          <Home className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform ${currentView === 'home' ? 'scale-110 fill-[#0066ff] dark:fill-blue-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 leading-none">Accueil</span>
        </button>

        {/* 2. 🔴 En direct */}
        <button
          onClick={() => navigateTo('live')}
          className={`min-h-[50px] flex flex-col items-center justify-center transition-all cursor-pointer relative ${
            currentView === 'live'
              ? 'text-[#0066ff] dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-400 hover:text-[#0066ff] dark:hover:text-blue-400'
          }`}
        >
          <div className="relative">
            <Radio className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform ${currentView === 'live' ? 'scale-110 text-[#0066ff] dark:text-blue-400' : ''}`} />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#ff003b] animate-ping" />
          </div>
          <span className="text-[10px] sm:text-[11px] mt-1 leading-none">En direct</span>
        </button>

        {/* 3. 🎫 Mes paris */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              navigateTo('auth');
            } else {
              navigateTo('my_bets');
            }
          }}
          className={`min-h-[50px] flex flex-col items-center justify-center transition-all cursor-pointer ${
            currentView === 'my_bets'
              ? 'text-[#0066ff] dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-400 hover:text-[#0066ff] dark:hover:text-blue-400'
          }`}
        >
          <CalendarCheck className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform ${currentView === 'my_bets' ? 'scale-110 text-[#0066ff] dark:text-blue-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 leading-none">Mes paris</span>
        </button>

        {/* 4. 🎮 Gaming */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              navigateTo('auth');
            } else {
              navigateTo('gaming');
            }
          }}
          className={`min-h-[50px] flex flex-col items-center justify-center transition-all cursor-pointer ${
            currentView === 'gaming'
              ? 'text-[#0066ff] dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-400 hover:text-[#0066ff] dark:hover:text-blue-400'
          }`}
        >
          <Gamepad2 className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform ${currentView === 'gaming' ? 'scale-110 text-[#0066ff] dark:text-blue-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 leading-none">Gaming</span>
        </button>

        {/* 5. ☰ Menu */}
        <button
          onClick={() => {
            if (onOpenMenu) {
              onOpenMenu();
            }
          }}
          className={`min-h-[50px] flex flex-col items-center justify-center transition-all cursor-pointer ${
            isMenuOpen
              ? 'text-[#0066ff] dark:text-blue-400 font-black'
              : 'text-slate-400 dark:text-slate-400 hover:text-[#0066ff] dark:hover:text-blue-400'
          }`}
          aria-label="Ouvrir le menu latéral"
        >
          <Menu className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform ${isMenuOpen ? 'scale-110 text-[#0066ff] dark:text-blue-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 leading-none">Menu</span>
        </button>

      </nav>
    </div>
  );
};
