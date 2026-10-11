import React from 'react';
import { X, User as UserIcon, Wallet, ShieldCheck, Ticket, LogOut, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatCurrency } from '../../utils/date';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { navigateTo, resetToPublicHome } = useNavigation();

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Mon Espace FLASH</h3>
              <p className="text-xs text-slate-500">Compte & Préférences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isAuthenticated && user ? (
            <>
              {/* User Identity Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-blue-100">
                      ID Joueur : {user.id}
                    </span>
                    <h4 className="text-lg font-bold font-display mt-0.5">{user.name}</h4>
                    <p className="text-xs text-blue-100">{user.email}</p>
                  </div>
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] tracking-wide uppercase">
                      Admin
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between relative z-10">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-200">Solde disponible</span>
                    <div className="text-xl font-bold font-mono">{formatCurrency(user.balance)}</div>
                  </div>
                  <button
                    onClick={() => handleAction(() => navigateTo('balance'))}
                    className="px-3 py-1.5 rounded-xl bg-white text-blue-700 text-xs font-bold hover:bg-blue-50 active:scale-95 transition-all shadow-sm"
                  >
                    Gérer solde
                  </button>
                </div>
              </div>

              {/* Menu options */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => handleAction(() => navigateTo('my_bets'))}
                  className="w-full p-3 rounded-xl flex items-center justify-between hover:bg-slate-50 border border-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Mes Paris sportifs</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleAction(() => navigateTo('profile'))}
                  className="w-full p-3 rounded-xl flex items-center justify-between hover:bg-slate-50 border border-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Détails du compte</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Administration (if Admin) - strictly isolated */}
                {isAdmin && (
                  <button
                    onClick={() => handleAction(() => navigateTo('admin_balance'))}
                    className="w-full p-3 rounded-xl flex items-center justify-between bg-amber-50 hover:bg-amber-100/70 border border-amber-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-900 block">Administration FLASH</span>
                        <span className="text-[10px] text-amber-700">Gestion financière & soldes utilisateurs</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  </button>
                )}
              </div>

              {/* Logout button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                    resetToPublicHome();
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </>
          ) : (
            /* Visitor State */
            <div className="space-y-4 py-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Bienvenue sur FLASH</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                  Connectez-vous pour placer vos paris, suivre vos coupons et gérer votre solde sécurisé.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth('login');
                    navigateTo('auth');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Connexion
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth('register');
                    navigateTo('auth');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Créer un compte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
