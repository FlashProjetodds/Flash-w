import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Server,
  Activity,
  Layers,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ExternalLink,
  Sliders,
  FileText,
  Users,
  Trash2,
  Radio,
  Power,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { DataSourceConfig, SystemLog, User, BalanceTransaction } from '../../types';
import { sportsDataManager } from '../../services/sportsData';
import {
  loadUsers,
  loadTransactions,
  findUserById,
  adminCreditBalance,
  adminDebitBalance
} from '../../services/storage';
import { formatCurrency, formatFullDateTime } from '../../utils/date';

interface UserPortfolioManagerProps {
  registeredUsers: User[];
  currentUser: User;
  onRefreshData: () => void;
  refreshUser: () => void;
}

/**
 * Isolated & Memoized UserPortfolioManager component.
 * Encapsulates onChange handlers and state updates (searchQuery, amount, notes, searchedUser, operationType)
 * so that keystrokes and typing never trigger unnecessary re-renders of the parent AdminDashboardView
 * (Sources and Logs tables), ensuring lightning-fast performance and zero UI lag.
 */
const UserPortfolioManager: React.FC<UserPortfolioManagerProps> = React.memo(({
  registeredUsers,
  currentUser,
  onRefreshData,
  refreshUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [operationType, setOperationType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState<number>(50);
  const [notes, setNotes] = useState('');
  const [balanceFeedback, setBalanceFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSearchUser = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setBalanceFeedback(null);
    const q = searchQuery.trim();
    if (!q) {
      setSearchedUser(null);
      return;
    }
    const found = findUserById(q);
    if (found) {
      setSearchedUser(found);
    } else {
      setSearchedUser(null);
      setBalanceFeedback({
        type: 'error',
        message: `Aucun utilisateur trouvé avec l'identifiant "${q}".`,
      });
    }
  }, [searchQuery]);

  const handleExecuteBalanceOp = useCallback(() => {
    if (!currentUser || !searchedUser || !amount || amount <= 0) return;

    if (operationType === 'credit') {
      const res = adminCreditBalance(currentUser, searchedUser.id, amount, notes || 'Crédit administration FLASH');
      if (res.success) {
        setBalanceFeedback({
          type: 'success',
          message: `Solde de ${searchedUser.name} (${searchedUser.id}) crédité de +${amount} FCFA avec succès.`,
        });
        setSearchedUser(findUserById(searchedUser.id) || null);
        onRefreshData();
        refreshUser();
      } else {
        setBalanceFeedback({ type: 'error', message: res.error || 'Erreur lors du crédit' });
      }
    } else {
      const res = adminDebitBalance(currentUser, searchedUser.id, amount, notes || 'Débit administration FLASH');
      if (res.success) {
        setBalanceFeedback({
          type: 'success',
          message: `Solde de ${searchedUser.name} (${searchedUser.id}) débité de -${amount} FCFA avec succès.`,
        });
        setSearchedUser(findUserById(searchedUser.id) || null);
        onRefreshData();
        refreshUser();
      } else {
        setBalanceFeedback({ type: 'error', message: res.error || 'Erreur lors du débit' });
      }
    }
    setShowConfirmModal(false);
    setNotes('');
  }, [currentUser, searchedUser, amount, operationType, notes, onRefreshData, refreshUser]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAmount(isNaN(val) ? 0 : Math.max(0, val));
  }, []);

  const handleSearchQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(e.target.value);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-5 shadow-sm space-y-3.5">
        <h3 className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Gestion du Portefeuille Unique (Règle 21 — Optimisé & Isolé)</span>
        </h3>

        <form onSubmit={handleSearchUser} className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ID Unique (ex: FL000001) ou email..."
              value={searchQuery}
              onChange={handleSearchQueryChange}
              className="w-full min-h-[38px] pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="min-h-[38px] px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0"
          >
            Rechercher
          </button>
        </form>

        {balanceFeedback && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
              balanceFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {balanceFeedback.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            )}
            <span>{balanceFeedback.message}</span>
          </div>
        )}

        {searchedUser && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/60">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{searchedUser.name}</span>
                  <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-blue-50 text-blue-600 border border-blue-200 font-bold">
                    {searchedUser.id}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">{searchedUser.email}</div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Solde Centralisé</div>
                <div className="text-base font-bold font-mono text-emerald-600">
                  {formatCurrency(searchedUser.balance)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-bold uppercase">Opération</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOperationType('credit')}
                    className={`min-h-[34px] px-2 rounded-lg text-xs font-bold border transition-all ${
                      operationType === 'credit'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + Crédit
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperationType('debit')}
                    className={`min-h-[34px] px-2 rounded-lg text-xs font-bold border transition-all ${
                      operationType === 'debit'
                        ? 'bg-rose-50 text-rose-600 border-rose-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    - Débit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-bold uppercase">Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  value={amount || ''}
                  onChange={handleAmountChange}
                  className="w-full min-h-[34px] px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1 font-bold uppercase">Motif obligatoire</label>
                <input
                  type="text"
                  placeholder="Ex: Dépôt guichet, Bonus..."
                  value={notes}
                  onChange={handleNotesChange}
                  className="w-full min-h-[34px] px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className={`w-full min-h-[36px] rounded-lg font-bold text-xs transition-all ${
                operationType === 'credit'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
              }`}
            >
              {operationType === 'credit' ? `Confirmer le crédit de +${amount} FCFA` : `Confirmer le débit de -${amount} FCFA`}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs sm:text-sm font-black text-blue-900 flex items-center justify-between">
          <span>Utilisateurs Enregistrés</span>
          <span className="text-[10px] font-mono text-slate-400 font-normal bg-slate-100 px-2 py-0.5 rounded">
            {registeredUsers.length} compte(s)
          </span>
        </h3>

        <div className="overflow-x-auto whitespace-nowrap">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                <th className="py-2.5 px-3">Identifiant</th>
                <th className="py-2.5 px-3">Nom</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Rôle</th>
                <th className="py-2.5 px-3 text-right">Solde Centralisé</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {registeredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-blue-600">{u.id}</td>
                  <td className="py-2 px-3 font-bold text-slate-800">{u.name}</td>
                  <td className="py-2 px-3 text-slate-500">{u.email}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        u.role === 'admin'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                    {formatCurrency(u.balance)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => {
                        setSearchedUser(u);
                        setSearchQuery(u.id);
                      }}
                      className="min-h-[26px] px-2.5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-blue-600 text-[10px] font-bold"
                    >
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirmModal && searchedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-sm w-full space-y-3.5 shadow-xl text-slate-800">
            <h4 className="text-sm font-black text-blue-900">Confirmation de l'Opération</h4>
            <p className="text-xs text-slate-600 leading-normal">
              Voulez-vous vraiment <strong>{operationType === 'credit' ? 'créditer' : 'débiter'}</strong> le portefeuille unique de{' '}
              <strong>{searchedUser.name}</strong> ({searchedUser.id}) de la somme suivante ?
            </p>
            <div className="text-lg font-bold font-mono text-center text-blue-600 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              {operationType === 'credit' ? '+' : '-'} {formatCurrency(amount)}
            </div>
            <div className="flex gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 min-h-[38px] bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg border border-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteBalanceOp}
                className="flex-1 min-h-[38px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const AdminDashboardView: React.FC = () => {
  const { user, isAdmin, refreshUser } = useAuth();
  const { goBack, navigateTo } = useNavigation();

  // Active Admin Sub-tab
  const [activeTab, setActiveTab] = useState<'sources' | 'users' | 'logs'>('sources');

  // Sources & Pipeline state
  const [sources, setSources] = useState<DataSourceConfig[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Users & Transactions state
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const loadAdminData = useCallback(async () => {
    const srcList = await sportsDataManager.fetchSources();
    setSources(srcList);
    const logList = await sportsDataManager.fetchSystemLogs();
    setLogs(logList);
    setRegisteredUsers(loadUsers());
    setTransactions(loadTransactions());
  }, []);

  const handleToggleSource = async (sourceId: string, currentEnabled: boolean) => {
    const nextState = !currentEnabled;
    const ok = await sportsDataManager.toggleSource(sourceId, nextState);
    if (ok) {
      setSources(prev =>
        prev.map(s => (s.id === sourceId ? { ...s, enabled: nextState } : s))
      );
      setSyncFeedback({
        type: 'success',
        message: `Source ${sourceId.toUpperCase()} ${nextState ? 'activée' : 'désactivée'}.`,
      });
    } else {
      setSyncFeedback({
        type: 'error',
        message: 'Erreur lors du changement d\'état de la source',
      });
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (confirm(`Voulez-vous vraiment supprimer définitivement la source ${sourceId.toUpperCase()} ?`)) {
      const ok = await sportsDataManager.deleteSource(sourceId);
      if (ok) {
        setSources(prev => prev.filter(s => s.id !== sourceId));
        setSyncFeedback({
          type: 'success',
          message: `Source ${sourceId.toUpperCase()} supprimée définitivement.`,
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: 'Erreur lors de la suppression de la source.',
        });
      }
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handlePurgeAllData = async () => {
    if (confirm("Voulez-vous vraiment effacer tous les événements sportifs et purger le cache ?")) {
      try {
        const res = await fetch('/api/sources/purge', { method: 'POST' });
        const data = await res.json();
        setSyncFeedback({
          type: 'success',
          message: data.message || 'Toutes les sources de données et événements ont été supprimés avec succès.',
        });
      } catch {
        setSyncFeedback({
          type: 'error',
          message: 'Erreur lors de la purge des données.',
        });
      }
      sportsDataManager.clearAllEvents();
      await loadAdminData();
    }
  };

  const handleSyncAllSourcesNow = async () => {
    setIsSyncingAll(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/sources/sync-all', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        if (data.errors && data.errors.length > 0) {
          setSyncFeedback({
            type: 'warning',
            message: `${data.message || 'Synchronisation globale terminée.'} (${data.errors.join(' | ')})`,
          });
        } else {
          setSyncFeedback({
            type: 'success',
            message: data.message || `Synchronisation globale achevée : ${data.matchesCount} matchs indexés de toutes les sources.`,
          });
        }
      } else {
        setSyncFeedback({
          type: 'error',
          message: data.error || data.message || 'Erreur lors du rafraîchissement global',
        });
      }
      await loadAdminData();
      await sportsDataManager.fetchFromBackend();
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Erreur lors du rafraîchissement global',
      });
    } finally {
      setIsSyncingAll(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  // Restrict access
  if (!user || !isAdmin) {
    return (
      <div className="py-16 px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Accès Restreint</h2>
        <p className="text-xs text-slate-500 mb-6">
          Seuls les administrateurs du système ont le droit d'accéder à FLASH Engine & Administration.
        </p>
        <button
          onClick={() => navigateTo('home')}
          className="min-h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
        >
          Retourner à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 max-w-6xl mx-auto text-slate-800 bg-slate-50 p-1 sm:p-2 rounded-2xl">
      
      {/* Top Header - White and Royal Blue minimal styling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider shrink-0">
              PANEL ADMIN
            </span>
            <span className="text-[10px] text-slate-500 font-mono truncate">
              ID : {user.id}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-blue-900 mt-0.5 truncate">
            FLASH Engine & Administration
          </h1>
        </div>

        {/* Global Purge Action */}
        <button
          onClick={handlePurgeAllData}
          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all self-stretch sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Purger les données</span>
        </button>
      </div>

      {syncFeedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 animate-in fade-in ${
            syncFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : syncFeedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {syncFeedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          ) : syncFeedback.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          )}
          <span className="break-all">{syncFeedback.message}</span>
        </div>
      )}

      {/* Admin Tabs Bar - Minimalist pill buttons optimized for narrow screen/Android viewports */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveTab('sources')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'sources'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/15 border border-blue-600'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Sources ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/15 border border-blue-600'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Portefeuilles ({registeredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/15 border border-blue-600'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Journaux ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: DATA SOURCES AND CONNECTORS */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          
          {/* Centralized Pipeline Banner (Light theme Blue-White) */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 sm:p-4 text-blue-900 shadow-sm relative overflow-hidden flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3" /> PIPELINE ARCHITECTURE FLASH
              </span>
              <h3 className="text-xs font-bold mt-0.5">
                Rapporteur Multi-Sources d'Agrégation Automatique
              </h3>
              <p className="text-[10px] text-blue-700 mt-0.5 max-w-xl leading-normal">
                Les sources ci-dessous sont gérées indépendamment. Les données de scores et statuts d'ESPN, LiveScore, OpenLigaDB et autres sources sont fusionnées dynamiquement.
              </p>
            </div>
            <button
              onClick={handleSyncAllSourcesNow}
              disabled={isSyncingAll}
              className="min-h-[34px] px-3.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Sync...' : 'Tout actualiser'}</span>
            </button>
          </div>

          {/* Grid of the 3 Additional Independent Sources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sources.map(source => {
              const isOnline = source.status === 'online';
              const isOffline = !source.enabled;

              return (
                <div
                  key={source.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    source.enabled
                      ? 'bg-white border-slate-200/80 shadow-sm hover:border-blue-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-xs shrink-0">
                        {source.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span className="truncate">{source.name}</span>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-600 shrink-0"
                            title="Ouvrir le portail source"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </h4>
                        <div className="text-[10px] text-slate-500 truncate">
                          {source.url.replace(/^https?:\/\//, '')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleSource(source.id, source.enabled)}
                        className={`min-h-[24px] px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                          source.enabled
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {source.enabled ? 'Actif' : 'Couper'}
                      </button>

                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="min-h-[24px] min-w-[24px] flex items-center justify-center rounded bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100 transition-colors"
                        title="Supprimer définitivement cette source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] py-1.5 border-t border-b border-slate-100 mb-2">
                    <span className="text-slate-500">Statut du flux :</span>
                    <div className="flex items-center gap-1">
                      {isOffline ? (
                        <span className="text-slate-400 font-bold">Désactivé</span>
                      ) : isOnline ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          En ligne
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold text-[10px]">
                          Erreur
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[8px] text-slate-400 uppercase font-bold block">Latence</span>
                      <span className="font-mono font-bold text-slate-700">
                        {source.responseTimeMs ? `${source.responseTimeMs} ms` : '-'}
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[8px] text-slate-400 uppercase font-bold block">Matchs</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {source.matchesCount || 0}
                      </span>
                    </div>
                  </div>

                  {source.lastError && (
                    <div className="mt-1.5 text-[9px] text-rose-500 truncate">
                      {source.lastError}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: USER BALANCE & PORTFOLIO MANAGEMENT (Règle 21 — Isolated & Optimized) */}
      {activeTab === 'users' && (
        <UserPortfolioManager
          registeredUsers={registeredUsers}
          currentUser={user}
          onRefreshData={loadAdminData}
          refreshUser={refreshUser}
        />
      )}

      {/* TAB 3: SYSTEM INTEGRATION LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black text-blue-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Journaux Système d'Agrégation & Scraping</span>
            </h3>
            <button
              onClick={async () => {
                const updated = await sportsDataManager.fetchSystemLogs();
                setLogs(updated);
              }}
              className="min-h-[30px] px-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-blue-500" />
              <span>Actualiser</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1 font-mono text-[10px]">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                Aucun log enregistré dans la session courante.
              </div>
            ) : (
              logs.map(log => {
                const isError = log.level === 'error';
                const isWarn = log.level === 'warn';
                const isSuccess = log.level === 'success';

                return (
                  <div
                    key={log.id}
                    className={`p-2 rounded border flex items-start gap-2 ${
                      isError
                        ? 'bg-rose-50 border-rose-100 text-rose-700'
                        : isWarn
                        ? 'bg-amber-50 border-amber-100 text-amber-700'
                        : isSuccess
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-slate-50 border-slate-150 text-slate-600'
                    }`}
                  >
                    <span className="text-[9px] text-slate-400 shrink-0 mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                    </span>
                    {log.source && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 border border-slate-300 text-[8px] text-slate-600 shrink-0 font-sans font-bold">
                        {log.source}
                      </span>
                    )}
                    <span className="flex-1 break-all leading-normal font-sans text-xs">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
