import React, { useEffect } from 'react';
import {
  X,
  Home,
  Radio,
  Trophy,
  CalendarCheck,
  Gamepad2,
  Star,
  User,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { FlashLogo } from './FlashLogo';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenLeagues: () => void;
  onOpenFavorites: () => void;
  onOpenSettings: () => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  onOpenLeagues,
  onOpenFavorites,
  onOpenSettings,
}) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { navigateTo } = useNavigation();

  // Handle hardware Back button / Escape key to close side menu & lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Push dummy history entry so Android Back button closes menu instead of exiting
    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    try {
      window.history.pushState({ sideMenuOpen: true }, '');
    } catch {}

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProfileClick = () => {
    onClose();
    if (isAuthenticated) {
      navigateTo('profile');
    } else {
      onOpenAuth('login');
    }
  };

  const handleNavigate = (action: () => void) => {
    onClose();
    try {
      action();
    } catch (err) {
      console.error("Navigation error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* 1. Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        aria-hidden="true"
      />

      {/* 2. Sliding Drawer Menu Container */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-[85vw] sm:w-[380px] max-w-[400px] bg-white dark:bg-[#071838] shadow-2xl border-r border-[#d9ebfc] dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-300 ease-out">
          
          {/* Header du menu */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-blue-50 dark:border-slate-800">
            <button
              onClick={() => handleNavigate(() => navigateTo('home'))}
              className="text-left cursor-pointer transition-opacity hover:opacity-90"
              aria-label="Accueil Flash"
            >
              <FlashLogo size="md" showSlogan={true} />
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Carte Profil Utilisateur */}
          <div className="px-4 py-3 border-b border-blue-50/80 dark:border-slate-800 bg-gradient-to-b from-blue-50/40 dark:from-slate-900/40 to-transparent">
            <div
              onClick={handleProfileClick}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#cde3fb] dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 shadow-2xs flex items-center justify-between gap-3 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-[#0066ff] dark:text-blue-300 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs border border-white dark:border-slate-700">
                  <User className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-[#071838] dark:text-white truncate group-hover:text-[#0066ff] transition-colors leading-tight">
                    {isAuthenticated && user?.name ? user.name : 'Utilisateur Flash'}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400 truncate mt-0.5">
                    {isAuthenticated && user?.email ? user.email : 'user@flash.com'}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
            </div>
          </div>

          {/* Corps de navigation défilant */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 no-scrollbar">
            
            {/* Navigation */}
            <div className="space-y-1">
              <h5 className="px-2 pb-1 text-[11px] font-bold text-blue-600/80 dark:text-blue-400 tracking-wider uppercase">
                Navigation
              </h5>

              <button
                onClick={() => handleNavigate(() => navigateTo('home'))}
                className="w-full p-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0066ff] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-slate-700 shadow-2xs">
                    <Home className="w-5 h-5 fill-[#0066ff]/20" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#071838] dark:text-slate-200 block group-hover:text-[#0066ff] transition-colors">
                      Accueil
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                      Tous les matchs et informations essentielles
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
              </button>

              <button
                onClick={() => handleNavigate(() => navigateTo('live'))}
                className="w-full p-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0066ff] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-slate-700 shadow-2xs">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#071838] dark:text-slate-200 block group-hover:text-[#0066ff] transition-colors">
                      En direct
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                      Matchs en cours et scores actualisés
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
              </button>

              <button
                onClick={() => handleNavigate(onOpenLeagues)}
                className="w-full p-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0066ff] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-slate-700 shadow-2xs">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#071838] dark:text-slate-200 block group-hover:text-[#0066ff] transition-colors">
                      Matchs par ligue
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                      Classements et compétitions par championnat
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
              </button>

              <button
                onClick={() =>
                  handleNavigate(() => {
                    if (isAuthenticated) {
                      navigateTo('my_bets');
                    } else {
                      onOpenAuth('login');
                    }
                  })
                }
                className="w-full p-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0066ff] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-slate-700 shadow-2xs">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#071838] dark:text-slate-200 block group-hover:text-[#0066ff] transition-colors">
                      Mes paris
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                      Paris et suivi des tickets
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
              </button>

              <button
                onClick={() =>
                  handleNavigate(() => {
                    if (isAuthenticated) {
                      navigateTo('gaming');
                    } else {
                      onOpenAuth('login');
                    }
                  })
                }
                className="w-full p-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0066ff] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-slate-700 shadow-2xs">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#071838] dark:text-slate-200 block group-hover:text-[#0066ff] transition-colors">
                      Gaming
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                      Espace jeux et divertissement
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
              </button>

              <button
                onClick={() => handleNavigate(onOpenFavorites)}
                className="w-full p-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0066ff] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-slate-700 shadow-2xs">
                    <Star className="w-5 h-5 fill-[#0066ff]/20" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#071838] dark:text-slate-200 block group-hover:text-[#0066ff] transition-colors">
                      Mes favoris
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                      Équipes, ligues et matchs favoris
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
              </button>
            </div>

            {/* Mon compte */}
            <div className="space-y-1 pt-1">
              <h5 className="px-2 pb-1 text-[11px] font-bold text-blue-600/80 dark:text-blue-400 tracking-wider uppercase">
                Mon compte
              </h5>

              <button
                onClick={handleProfileClick}
                className="w-full p-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0066ff] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-slate-700 shadow-2xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#071838] dark:text-slate-200 block group-hover:text-[#0066ff] transition-colors">
                      Mon profil
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                      Informations personnelles et paramètres
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
              </button>
            </div>

            {/* Application */}
            <div className="space-y-1 pt-1">
              <h5 className="px-2 pb-1 text-[11px] font-bold text-blue-600/80 dark:text-blue-400 tracking-wider uppercase">
                Application
              </h5>

              <button
                onClick={() => handleNavigate(onOpenSettings)}
                className="w-full p-2.5 rounded-2xl flex items-center justify-between hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0066ff] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-slate-700 shadow-2xs">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-[#071838] dark:text-slate-200 block group-hover:text-[#0066ff] transition-colors">
                      Paramètres
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                      Langue, apparence, notifications
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0066ff] transition-colors shrink-0" />
              </button>
            </div>

            {/* Espace privé */}
            {isAuthenticated && isAdmin && (
              <div className="space-y-1 pt-1">
                <h5 className="px-2 pb-1 text-[11px] font-bold text-amber-600 tracking-wider uppercase">
                  Espace privé
                </h5>

                <button
                  onClick={() => handleNavigate(() => navigateTo('admin_balance'))}
                  className="w-full p-2.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-amber-950 dark:text-amber-300 block group-hover:text-amber-800 transition-colors">
                        Administration
                      </span>
                      <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 block truncate">
                        Gestion et contrôle de l'application
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-500 group-hover:text-amber-700 transition-colors shrink-0" />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-blue-100/80 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 dark:from-slate-900 via-white dark:via-[#071838] to-blue-50/30 dark:to-slate-900 flex items-center justify-between gap-3 shrink-0">
            <div className="shrink-0">
              <FlashLogo size="sm" showSlogan={true} />
            </div>
            <div className="h-8 w-px bg-blue-200/80 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                Plus qu'une application, une passion !
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
