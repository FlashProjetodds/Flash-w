import React, { useState } from 'react';
import { Wallet, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { FlashLogo } from './FlashLogo';
import { ProfileModal } from '../profile/ProfileModal';

interface HeaderProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();
  const { navigateTo } = useNavigation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Format balance as in mockup (e.g. "12 450 FCFA")
  const formatSolde = (balance?: number) => {
    if (typeof balance !== 'number') return '0 FCFA';
    return `${balance.toLocaleString('fr-FR')} FCFA`;
  };

  const handleWalletClick = () => {
    if (isAuthenticated) {
      setIsProfileOpen(true);
    } else {
      navigateTo('auth');
    }
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-30 w-full m-0 p-0 bg-white/95 dark:bg-[#071838]/95 backdrop-blur-md border-b border-blue-100/70 dark:border-slate-800 transition-all shadow-[0_2px_12px_rgba(0,102,255,0.03)]">
        <div className="w-full px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left Zone: Brand Logo & Slogan seamlessly melted into the header */}
          <div className="flex items-center min-w-0 flex-1">
            <button
              onClick={() => navigateTo('home')}
              className="text-left cursor-pointer transition-opacity hover:opacity-95 min-w-0 truncate bg-transparent border-none p-0 m-0 shadow-none outline-none focus:outline-none focus:ring-0"
              aria-label="Accueil Flash"
            >
              <FlashLogo size="md" showSlogan={true} className="bg-transparent" />
            </button>
          </div>

          {/* Right Zone: Solde ONLY */}
          <div className="flex items-center shrink-0">
            {/* Solde / Wallet Capsule matching Mockup */}
            <button
              onClick={handleWalletClick}
              className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white dark:bg-[#071838] hover:bg-blue-50/50 dark:hover:bg-slate-800 border border-[#cde3fb] dark:border-slate-800 shadow-sm shadow-blue-500/5 transition-all active:scale-95 cursor-pointer"
              title="Mon portefeuille / Solde"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-br from-[#0099ff] to-[#0055ff] flex items-center justify-center text-white shadow-sm shadow-blue-500/30 shrink-0">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#0066ff] dark:text-sky-300 uppercase tracking-wide">
                  Solde
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-[#071838] dark:text-white tabular-nums whitespace-nowrap">
                  {isAuthenticated && user ? formatSolde(user.balance) : 'Connexion'}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#0066ff] dark:text-sky-300 opacity-70 group-hover:opacity-100 transition-opacity shrink-0 ml-0.5 hidden xs:block" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenAuth={onOpenAuth}
      />
    </>
  );
};
