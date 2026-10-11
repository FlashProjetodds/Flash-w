import React, { useState } from 'react';
import { User as UserIcon, Wallet, Copy, Check, LogOut, Shield, Clock, ArrowLeft, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { formatCurrency, formatFullDateTime, getUserTimeZone } from '../../utils/date';
import { loadTransactions } from '../../services/storage';

export const UserProfileView: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { goBack, navigateTo, resetToPublicHome } = useNavigation();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  // Read transactions for this user
  const userTransactions = loadTransactions().filter(t => t.userId === user.id);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    resetToPublicHome();
  };

  return (
    <div className="space-y-5 pb-24 max-w-2xl sm:max-w-3xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label="Retour"
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-slate-900 active:scale-95 transition-all shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
              Espace Personnel
            </h1>
            <p className="text-xs text-slate-500">
              Profil, solde et sécurité du compte
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="min-h-[40px] px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2 transition-all active:scale-98"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold font-display shadow-xs">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
                {isAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                    Administrateur
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Membre Vérifié
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Unique ID Badge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                ID Unique
              </div>
              <div className="text-sm font-bold font-mono text-blue-600 tabular-nums">
                {user.id}
              </div>
            </div>
            <button
              onClick={handleCopyId}
              aria-label="Copier l'identifiant"
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Solde Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Solde disponible
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={() => navigateTo('admin_balance')}
              className="px-3 py-1.5 rounded-xl bg-white text-blue-700 text-xs font-bold hover:bg-blue-50 shadow-sm flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administration</span>
            </button>
          )}
        </div>

        <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight mb-2">
          {formatCurrency(user.balance)}
        </div>

        <p className="text-xs text-blue-100 max-w-md leading-relaxed">
          {isAdmin
            ? 'En tant qu’administrateur, vous disposez des droits pour gérer les soldes via le module d’administration sécurisé.'
            : 'Conformément aux normes FLASH, votre solde est protégé. Seul un administrateur agréé peut créditer ou débiter votre compte avec votre ID unique.'}
        </p>
      </div>

      {/* Automatic Timezone Display */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>Fuseau horaire automatique de l'appareil :</span>
        </div>
        <span className="font-mono font-bold text-slate-800">
          {getUserTimeZone()}
        </span>
      </div>

      {/* Transaction History for User */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Historique des opérations</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {userTransactions.length} opération(s)
          </span>
        </div>

        {userTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Aucun mouvement enregistré sur ce compte pour l'instant.
          </div>
        ) : (
          <div className="space-y-2">
            {userTransactions.map(tx => (
              <div
                key={tx.id}
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold uppercase text-[11px] ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'credit' ? '+ Crédit' : '- Débit'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {formatFullDateTime(tx.timestamp)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Par {tx.adminResponsible} · Réf: {tx.id}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono font-black text-sm ${
                      tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Nouveau solde : {formatCurrency(tx.balanceAfter)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
