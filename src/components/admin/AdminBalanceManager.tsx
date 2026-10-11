import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck,
  Clock,
  History,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { User, BalanceTransaction } from '../../types';
import {
  findUserById,
  adminCreditBalance,
  adminDebitBalance,
  loadTransactions,
  loadUsers,
} from '../../services/storage';
import { formatCurrency, formatFullDateTime } from '../../utils/date';

export const AdminBalanceManager: React.FC = () => {
  const { user, isAdmin, refreshUser } = useAuth();
  const { goBack, navigateTo } = useNavigation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Operation state
  const [operationType, setOperationType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState<number>(50);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Explicit confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Audit history
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isAdmin) {
      setTransactions(loadTransactions());
      setRegisteredUsers(loadUsers());
    }
  }, [isAdmin]);

  // Strict Security Enforcement
  if (!user || user.role !== 'admin') {
    return (
      <div className="py-16 px-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Accès Non Autorisé</h2>
        <p className="text-xs text-slate-400 mb-6">
          Cette section est strictement réservée aux comptes disposant des prérogatives d'administrateur FLASH.
        </p>
        <button
          onClick={() => navigateTo('home')}
          className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
        >
          Retourner à l'accueil
        </button>
      </div>
    );
  }

  const handleSearchUser = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setFeedback(null);

    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Veuillez saisir l'identifiant unique ou l'email.");
      setSearchedUser(null);
      return;
    }

    const found = findUserById(query);
    if (!found) {
      setSearchError(`Aucun utilisateur trouvé avec l'identifiant "${query}".`);
      setSearchedUser(null);
    } else {
      setSearchedUser(found);
      setSearchError(null);
    }
  };

  const handleSelectQuickUser = (target: User) => {
    setSearchQuery(target.id);
    setSearchedUser(target);
    setSearchError(null);
  };

  const handleOpenConfirm = () => {
    setFeedback(null);

    if (!searchedUser) {
      setFeedback({ type: 'error', message: 'Veuillez d’abord sélectionner un utilisateur.' });
      return;
    }

    if (!amount || amount <= 0 || isNaN(amount)) {
      setFeedback({ type: 'error', message: 'Veuillez saisir un montant valide strictement positif.' });
      return;
    }

    if (operationType === 'debit' && amount > searchedUser.balance) {
      setFeedback({
        type: 'error',
        message: `Débit impossible : le montant (${formatCurrency(amount)}) dépasse le solde disponible (${formatCurrency(searchedUser.balance)}). Aucun solde négatif n'est autorisé.`,
      });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteOperation = () => {
    if (!searchedUser || !user) return;

    if (operationType === 'credit') {
      const res = adminCreditBalance(user, searchedUser.id, amount, notes);
      if (res.success && res.updatedUser) {
        setSearchedUser(res.updatedUser);
        setTransactions(loadTransactions());
        setRegisteredUsers(loadUsers());
        refreshUser();
        setShowConfirmModal(false);
        setFeedback({
          type: 'success',
          message: `Succès : ${formatCurrency(amount)} ont été crédités sur le compte de ${searchedUser.name} (${searchedUser.id}). Nouveau solde : ${formatCurrency(res.updatedUser.balance)}.`,
        });
      } else {
        setShowConfirmModal(false);
        setFeedback({ type: 'error', message: res.error || 'Erreur lors du crédit.' });
      }
    } else {
      const res = adminDebitBalance(user, searchedUser.id, amount, notes);
      if (res.success && res.updatedUser) {
        setSearchedUser(res.updatedUser);
        setTransactions(loadTransactions());
        setRegisteredUsers(loadUsers());
        refreshUser();
        setShowConfirmModal(false);
        setFeedback({
          type: 'success',
          message: `Succès : ${formatCurrency(amount)} ont été débités du compte de ${searchedUser.name} (${searchedUser.id}). Nouveau solde : ${formatCurrency(res.updatedUser.balance)}.`,
        });
      } else {
        setShowConfirmModal(false);
        setFeedback({ type: 'error', message: res.error || 'Erreur lors du débit.' });
      }
    }
  };

  const calculatedBalanceAfter = searchedUser
    ? operationType === 'credit'
      ? searchedUser.balance + amount
      : searchedUser.balance - amount
    : 0;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
              Gestion Administrative du Solde
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Module sécurisé de crédit et débit avec traçabilité intégrale
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Step 1: Search User */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>1. Recherche de l'utilisateur par ID Unique</span>
        </h2>

        <form onSubmit={handleSearchUser} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ex : FL328741 ou email@utilisateur.com"
              className="w-full min-h-[44px] pl-10 pr-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-98 flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Rechercher</span>
          </button>
        </form>

        {searchError && (
          <p className="text-xs text-rose-400 mt-2">{searchError}</p>
        )}

        {/* Quick User Picker from existing accounts */}
        {registeredUsers.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 mb-2">Comptes enregistrés sur la plateforme :</div>
            <div className="flex flex-wrap gap-2">
              {registeredUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectQuickUser(u)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    searchedUser?.id === u.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono text-emerald-400 mr-1">{u.id}</span>
                  <span>{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Target User Account Details & Operation */}
      {searchedUser && (
        <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-6 space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold font-display text-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{searchedUser.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {searchedUser.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{searchedUser.email}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Solde Actuel</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {formatCurrency(searchedUser.balance)}
              </div>
            </div>
          </div>

          {/* Operation Selector (Credit vs Debit) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              2. Nature de l'opération
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setOperationType('credit')}
                className={`min-h-[44px] rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  operationType === 'credit'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Créditer le compte</span>
              </button>
              <button
                type="button"
                onClick={() => setOperationType('debit')}
                className={`min-h-[44px] rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  operationType === 'debit'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Débiter le compte</span>
              </button>
            </div>
          </div>

          {/* Amount Input & Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Montant de l'opération (FCFA)
              </label>
              {operationType === 'debit' && (
                <span className="text-[11px] text-slate-400">
                  Maximum débitable : <strong className="text-white">{formatCurrency(searchedUser.balance)}</strong>
                </span>
              )}
            </div>

            <input
              type="number"
              min="100"
              step="100"
              value={amount || ''}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[48px] px-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500"
            />

            <div className="grid grid-cols-5 gap-2 mt-2">
              {[5000, 10000, 25000, 50000, 100000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`min-h-[38px] text-xs font-semibold rounded-lg border transition-all ${
                    amount === val
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  +{val.toLocaleString('fr-FR')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Motif / Référence interne (optionnel)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex : Rechargement agence, régularisation, virement direct"
              className="w-full min-h-[44px] px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleOpenConfirm}
            className={`w-full min-h-[48px] font-bold text-sm rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 ${
              operationType === 'credit'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
            }`}
          >
            <span>{operationType === 'credit' ? `Procéder au crédit de ${formatCurrency(amount)}` : `Procéder au débit de ${formatCurrency(amount)}`}</span>
          </button>

        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && searchedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0b1222] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="text-center">
              <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3 ${
                operationType === 'credit'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Confirmation explicite de l'opération
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Veuillez valider les paramètres avant exécution et inscription dans le registre d'audit.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Bénéficiaire :</span>
                <span className="font-semibold text-white">{searchedUser.name} ({searchedUser.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nature :</span>
                <span className={`font-bold uppercase ${operationType === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {operationType === 'credit' ? 'Crédit de solde' : 'Débit de solde'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Montant :</span>
                <span className="font-mono font-bold text-sm text-white">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Solde avant :</span>
                <span className="font-mono text-slate-300">{formatCurrency(searchedUser.balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Solde après opération :</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(calculatedBalanceAfter)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Administrateur :</span>
                <span className="text-slate-300">{user.name} ({user.id})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteOperation}
                className={`min-h-[44px] px-4 rounded-xl font-bold text-xs text-white ${
                  operationType === 'credit'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-rose-500 hover:bg-rose-400'
                }`}
              >
                Confirmer définitivement
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Step 3: Complete Audit Trail History */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-display">
              Registre d'Audit des Opérations
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {transactions.length} opération(s) enregistrée(s)
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Aucune transaction dans le registre d'audit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Date & Heure</th>
                  <th className="py-3 px-3">Utilisateur</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Montant</th>
                  <th className="py-3 px-3">Avant / Après</th>
                  <th className="py-3 px-3">Admin Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-sans">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400 font-mono">
                      {formatFullDateTime(t.timestamp)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-white">
                      {t.userId}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.type === 'credit'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {t.type === 'credit' ? 'Crédit' : 'Débit'}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold">
                      <span className={t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}>
                        {t.type === 'credit' ? '+' : '-'} {formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-400">
                      {formatCurrency(t.balanceBefore)} → <span className="text-white font-bold">{formatCurrency(t.balanceAfter)}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                      {t.adminResponsible}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
