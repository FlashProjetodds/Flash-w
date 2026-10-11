import React, { useState, useEffect, useMemo } from 'react';
import { SplashScreen } from './components/common/SplashScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation, isPrivateView } from './context/NavigationContext';
import { BetProvider, useBets } from './context/BetContext';
import { SportsProvider, useSports } from './context/SportsContext';
import { Header } from './components/common/Header';
import { SearchBar } from './components/common/SearchBar';
import { BottomNav } from './components/common/BottomNav';
import { CarouselBanner } from './components/common/CarouselBanner';
import { AuthModal } from './components/auth/AuthModal';
import { SportsCategoriesBar } from './components/sports/SportsCategoriesBar';
import { TimeTabs, TimeTab } from './components/sports/TimeTabs';
import { MatchCard, MatchCardSkeletonGrid } from './components/sports/MatchCard';
import { EmptyMatchesState } from './components/sports/EmptyMatchesState';
import { MatchDetailView } from './components/sports/MatchDetailView';
import { GamingView } from './components/gaming/GamingView';
import { BetSlipDrawer } from './components/bets/BetSlipDrawer';
import { MyBetsView } from './components/bets/MyBetsView';
import { UserProfileView } from './components/profile/UserProfileView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AuthView } from './components/auth/AuthView';
import { SideMenuDrawer } from './components/common/SideMenuDrawer';
import { FavoritesModal } from './components/common/FavoritesModal';
import { SettingsModal } from './components/common/SettingsModal';
import { LeaguesModal } from './components/sports/LeaguesModal';
import { sportsDataManager, ScraperBackendStatus } from './services/sportsData';
import { SportEvent } from './types';
import { sortEventsAscending, groupEventsByDay } from './utils/sorting';
import { getParisDateKey } from './utils/date';
import { normalizeSportName } from './types/sports';
import { isExplicitLiveMatch, isExplicitFinishedMatch } from './utils/liveMatch';
import { CheckCircle2, AlertCircle, AlertTriangle, X, Sparkles, Calendar } from 'lucide-react';

function MainApp() {
  const { isDataLoaded, events, isSyncing, backendStatus } = useSports();
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashScreenVisible, setIsSplashScreenVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Safety timer for clean 4s splash experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Trigger fade-out when data is ready and safety timer is done
  useEffect(() => {
    if (isDataLoaded && isReady) {
      setIsSplashScreenVisible(false);
      const timer = setTimeout(() => setShowSplash(false), 1000); // Matches CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isDataLoaded, isReady]);

  const { isAuthenticated, user, isAdmin } = useAuth();
  const { currentView, selectedEventId, selectedSport, navigateTo, openMatchDetail } = useNavigation();
  const { selections, isSlipOpen, settlementToast, dismissToast } = useBets();
  const hasSelections = selections.length > 0;

  // Real sports data state from SportsContext
  const [activeSportFilter, setActiveSportFilter] = useState<string>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [activeTimeTab, setActiveTimeTab] = useState<TimeTab>('live');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isBackgroundUpdating = isSyncing;

  // Subtle score flashing state (scores & odds pulse on live updates)
  const [flashingMatchIds, setFlashingMatchIds] = useState<Record<string, number>>({});

  // Background update flag (either automated background sync or user-triggered refresh)
  const isUpdatingData = isBackgroundUpdating || isRefreshing;

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Side Menu & secondary dialog states
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLeaguesModalOpen, setIsLeaguesModalOpen] = useState(false);

  // Goal alert subscription for subtle score flashing only (stable lifecycle)
  useEffect(() => {
    const unsubscribeGoal = sportsDataManager.subscribeGoalAlert(alert => {
      setFlashingMatchIds(prev => {
        const next = { ...prev };
        alert.eventIds.forEach(id => {
          next[id] = Date.now() + 8500;
        });
        return next;
      });
    });
    return () => {
      unsubscribeGoal();
    };
  }, []);

  // Sync selectedSport from navigation to sport filter
  useEffect(() => {
    if (selectedSport) {
      setActiveSportFilter(prev => (prev === selectedSport ? prev : selectedSport));
    }
  }, [selectedSport]);

  // Sync currentView with activeTimeTab when user clicks bottom navigation
  useEffect(() => {
    if (currentView === 'live') {
      setActiveTimeTab('live');
    } else if (currentView === 'today') {
      setActiveTimeTab('today');
    } else if (currentView === 'upcoming') {
      setActiveTimeTab('upcoming');
    }
  }, [currentView]);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    navigateTo('auth');
  };

  const handleRefreshFeed = async () => {
    setIsRefreshing(true);
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
    try {
      await Promise.race([sportsDataManager.triggerScrape(), timeoutPromise]);
    } catch {}
    setIsRefreshing(false);
  };

  // Helper: check if finished match is within 6 hours window
  const isFinishedWithin6Hours = (e: SportEvent): boolean => {
    const todayKey = getParisDateKey(new Date());
    const isFinished = isExplicitFinishedMatch(e) || getParisDateKey(e.startTime) < todayKey;
    if (!isFinished) return false;
    const refTime = new Date(e.finishedAt || e.startTime).getTime();
    if (isNaN(refTime)) return true;
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    return (Date.now() - refTime) <= SIX_HOURS_MS;
  };

  // Tab-specific matches BEFORE sport filtering, to count sports accurately for each selected tab
  const activeTabEventsAllSports = useMemo(() => {
    const todayKey = getParisDateKey(new Date());
    
    if (activeTimeTab === 'live') {
      return events.filter(e => isExplicitLiveMatch(e));
    }
    if (activeTimeTab === 'today') {
      // Tous les matchs programmés pour la journée en cours, indépendamment de leur statut live ou pré-match
      return events.filter(e => !isExplicitFinishedMatch(e) && getParisDateKey(e.startTime) === todayKey);
    }
    if (activeTimeTab === 'finished') {
      return events.filter(e => isFinishedWithin6Hours(e));
    }
    // 'upcoming' (À venir) : tous les matchs programmés pour les dates ultérieures
    return events.filter(e => !isExplicitFinishedMatch(e) && getParisDateKey(e.startTime) > todayKey);
  }, [events, activeTimeTab]);

  // Tab events filtered by search query (if any), ensuring sport counts match exactly what is in the table
  const tabEventsForSportCounts = useMemo(() => {
    if (!searchQuery.trim()) return activeTabEventsAllSports;
    const q = searchQuery.toLowerCase().trim();
    return activeTabEventsAllSports.filter(e =>
      e.homeTeam.toLowerCase().includes(q) ||
      e.awayTeam.toLowerCase().includes(q) ||
      e.competition.toLowerCase().includes(q) ||
      e.sport.toLowerCase().includes(q)
    );
  }, [activeTabEventsAllSports, searchQuery]);

  // Sports counts for categories and "Plus" modal, calculated dynamically for the active tab!
  const sportsCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of tabEventsForSportCounts) {
      const sp = normalizeSportName(e.sport || 'football');
      counts[sp] = (counts[sp] || 0) + 1;
    }
    return counts;
  }, [tabEventsForSportCounts]);

  // Dynamic list of available leagues / championships in current active tab and sport
  const availableLeagues = useMemo(() => {
    // Events in current active tab filtered by sport
    const tabSportEvents = activeTabEventsAllSports.filter(e => {
      if (activeSportFilter === 'all') return true;
      return normalizeSportName(e.sport) === normalizeSportName(activeSportFilter);
    });

    const counts = new Map<string, number>();
    for (const e of tabSportEvents) {
      const comp = (e.competition || 'Autres').trim();
      if (comp) {
        counts.set(comp, (counts.get(comp) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([id, count]) => ({
        id,
        name: id,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeTabEventsAllSports, activeSportFilter]);

  // Reset selected league if it doesn't exist in the current sport/tab selection
  useEffect(() => {
    if (selectedLeague !== 'all' && !availableLeagues.some(l => l.id.toLowerCase() === selectedLeague.toLowerCase())) {
      setSelectedLeague('all');
    }
  }, [availableLeagues, selectedLeague]);

  // Si le sport actif ne compte aucun match dans l'onglet courant, basculer automatiquement sur 'all' pour éviter d'afficher un tableau vide
  useEffect(() => {
    if (activeSportFilter !== 'all') {
      const normActive = normalizeSportName(activeSportFilter);
      const count = sportsCounts[normActive] || 0;
      if (count === 0) {
        setActiveSportFilter('all');
      }
    }
  }, [activeSportFilter, sportsCounts]);

  // Filter events by selected sport AND selected league
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (activeSportFilter !== 'all' && normalizeSportName(e.sport) !== normalizeSportName(activeSportFilter)) {
        return false;
      }
      if (selectedLeague !== 'all') {
        const comp = (e.competition || '').trim().toLowerCase();
        const target = selectedLeague.trim().toLowerCase();
        if (comp !== target) {
          return false;
        }
      }
      return true;
    });
  }, [events, activeSportFilter, selectedLeague]);

  // 1. Live matches: strictly matches confirmed live by the source (never inferred from elapsed clock)
  const liveMatches = useMemo(() => {
    return sortEventsAscending(
      filteredEvents.filter(e => isExplicitLiveMatch(e))
    );
  }, [filteredEvents]);

  // 2. Today's matches: all matches whose date matches the current day, regardless of live or pre-match status
  const todayMatches = useMemo(() => {
    const todayKey = getParisDateKey(new Date());
    return sortEventsAscending(
      filteredEvents.filter(e => {
        if (isExplicitFinishedMatch(e)) return false;
        return getParisDateKey(e.startTime) === todayKey;
      })
    );
  }, [filteredEvents]);

  // 3. Upcoming matches: all matches scheduled for future dates (tomorrow onwards)
  const upcomingMatches = useMemo(() => {
    const todayKey = getParisDateKey(new Date());
    return sortEventsAscending(
      filteredEvents.filter(e => {
        if (isExplicitFinishedMatch(e)) return false;
        const dateKey = getParisDateKey(e.startTime);
        return dateKey > todayKey;
      })
    );
  }, [filteredEvents]);

  // 4. Finished matches: matches with finished status within 6 hours window
  const finishedMatches = useMemo(() => {
    return sortEventsAscending(
      filteredEvents.filter(e => {
        if (isExplicitLiveMatch(e)) return false;
        return isFinishedWithin6Hours(e);
      })
    );
  }, [filteredEvents]);

  // Matches currently visible based on active time tab
  const activeTabMatches = useMemo(() => {
    if (activeTimeTab === 'live') return liveMatches;
    if (activeTimeTab === 'today') return todayMatches;
    if (activeTimeTab === 'finished') return finishedMatches;
    return upcomingMatches;
  }, [activeTimeTab, liveMatches, todayMatches, upcomingMatches, finishedMatches]);

  // Real-time search filter applied directly to active matches
  const displayMatches = useMemo(() => {
    if (!searchQuery.trim()) return activeTabMatches;
    const q = searchQuery.toLowerCase().trim();
    return activeTabMatches.filter(e =>
      e.homeTeam.toLowerCase().includes(q) ||
      e.awayTeam.toLowerCase().includes(q) ||
      e.competition.toLowerCase().includes(q) ||
      e.sport.toLowerCase().includes(q)
    );
  }, [activeTabMatches, searchQuery]);

  // Group matches by day with French local time labels (ex: "Aujourd'hui", "Demain", "Lun 12 Oct")
  const groupedMatches = useMemo(() => {
    return groupEventsByDay(displayMatches);
  }, [displayMatches]);

  // Selected event for match detail
  const currentDetailEvent = selectedEventId
    ? sportsDataManager.getEventById(selectedEventId)
    : null;

  // Counts for the 4 tabs
  const tabCounts = {
    live: liveMatches.length,
    today: todayMatches.length,
    upcoming: upcomingMatches.length,
    finished: finishedMatches.length,
  };

  // Determine if we are on the main sporting feed views
  const isMainSportsView =
    currentView === 'home' ||
    currentView === 'live' ||
    currentView === 'today' ||
    currentView === 'upcoming' ||
    currentView === 'sports';

  // Strict protection: if unauthenticated user attempts to access any private route, redirect to home immediately
  useEffect(() => {
    if (!isAuthenticated && isPrivateView(currentView)) {
      navigateTo('home');
    }
  }, [isAuthenticated, currentView, navigateTo]);

  // Dedicated full-page authentication view (matching Image design)
  if (currentView === 'auth') {
    return (
      <AuthView
        initialMode={authModalMode}
        onSuccess={() => navigateTo('home')}
      />
    );
  }

  if (showSplash) {
    return <SplashScreen isVisible={isSplashScreenVisible} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fbff] via-[#edf5ff] to-[#f8fbff] dark:from-[#050b14] dark:via-[#071838] dark:to-[#0b1222] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-700 w-full max-w-full overflow-x-hidden box-border">
      
      {/* 1. HEADER FLASH (matching Image 2) */}
      <Header onOpenAuth={openAuth} />

      {/* Floating Settlement & Win Alert Notification */}
      {settlementToast && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-xl border backdrop-blur-xl flex items-start gap-3 transition-all ${
              settlementToast.type === 'win'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                : 'bg-slate-900 text-white border-slate-800 shadow-black/30'
            }`}
          >
            <div className="p-1.5 rounded-xl bg-white/20 shrink-0">
              {settlementToast.type === 'win' ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                <span>{settlementToast.title}</span>
                {settlementToast.amount && (
                  <span className="px-1.5 py-0.5 rounded bg-white text-emerald-800 font-mono text-[11px] font-black">
                    +{Math.round(settlementToast.amount).toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </div>
              <p className="text-xs opacity-90 mt-0.5 leading-snug break-words">
                {settlementToast.message}
              </p>
            </div>

            <button
              onClick={dismissToast}
              className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-2xl sm:max-w-4xl lg:max-w-7xl w-full max-w-full mx-auto px-3 sm:px-6 py-3 sm:py-5 min-w-0 box-border overflow-x-hidden">
        
        {/* VIEW ROUTING (Protected by authentication) */}
        {currentView === 'match_detail' && currentDetailEvent && isAuthenticated ? (
          /* 8. Dedicated Match Detail Page (Screen 2 in Image 2) - Protected */
          <MatchDetailView event={currentDetailEvent} />
        ) : currentView === 'gaming' && isAuthenticated ? (
          /* Gaming View for Bottom Nav - Protected */
          <GamingView />
        ) : currentView === 'my_bets' && isAuthenticated ? (
          /* My Bets View - Protected */
          <MyBetsView />
        ) : (currentView === 'profile' || currentView === 'balance') && isAuthenticated ? (
          /* User Profile & Balance View - Protected */
          <UserProfileView />
        ) : currentView === 'admin_balance' && isAuthenticated && isAdmin ? (
          /* 12. Admin Balance Management - Protected */
          <AdminDashboardView />
        ) : isMainSportsView ? (
          /* 1. NOUVEL ÉCRAN D’ACCUEIL (Ordonné strictement selon la spécification) */
          <div className="space-y-3.5 sm:space-y-4 pb-24 w-full max-w-full min-w-0 box-border">
            
            {/* 2. BARRE DE RECHERCHE (placée directement sous le header) */}
            <div className="w-full">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Rechercher un match, une équipe, un championnat..."
              />
            </div>

            {/* 3. GRANDE BANNIÈRE SPORTIVE (dynamique, carrousel 5s) */}
            <CarouselBanner onExplore={() => setActiveTimeTab('live')} />

            {/* 4. CATÉGORIES DE SPORTS (⚽ Football, 🏀 Basketball, 🎾 Tennis, 🏏 Cricket, ▦ Plus) + FILTRAGE PAR LIGUE */}
            <SportsCategoriesBar
              selectedSport={activeSportFilter}
              onSelectSport={(sportId) => {
                if (sportId !== 'all') {
                  const norm = normalizeSportName(sportId);
                  const count = sportsCounts[norm] || 0;
                  if (count === 0) return; // Empêcher la sélection d'une discipline sans match
                }
                setActiveSportFilter(sportId);
                setSelectedLeague('all');
              }}
              sportsCounts={sportsCounts}
              selectedLeague={selectedLeague}
              onSelectLeague={setSelectedLeague}
              availableLeagues={availableLeagues}
            />

            {/* 5. ONGLETS DIRECT / AUJOURD’HUI / À VENIR (+ titre de section) */}
            <TimeTabs
              activeTab={activeTimeTab}
              onSelectTab={setActiveTimeTab}
              counts={tabCounts}
            />

            {/* 6. LISTE DES MATCHS (flux en direct) */}
            {isUpdatingData && displayMatches.length === 0 ? (
              /* Squelettes personnalisés MatchCard lors du chargement ou de la mise à jour en arrière-plan */
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-[#0066ff] text-xs font-semibold shadow-xs animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0066ff] animate-ping" />
                    <span>Mise à jour en arrière-plan des cotes et scores en direct...</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-600/80">Synchronisation active</span>
                </div>
                <MatchCardSkeletonGrid count={activeTimeTab === 'live' ? 4 : 6} />
              </div>
            ) : displayMatches.length === 0 ? (
              <div className="space-y-3">
                <EmptyMatchesState
                  title={
                    searchQuery
                      ? `Aucun résultat pour "${searchQuery}"`
                      : selectedLeague !== 'all'
                      ? `Aucun match pour « ${selectedLeague} »`
                      : activeTimeTab === 'live'
                      ? 'Aucun match en direct actuellement'
                      : activeTimeTab === 'today'
                      ? 'Aucun match programmé aujourd’hui'
                      : activeTimeTab === 'finished'
                      ? 'Aucun match terminé récent'
                      : 'Aucun match à venir'
                  }
                  description={
                    searchQuery
                      ? 'Vérifiez l’orthographe ou essayez avec un autre nom d’équipe ou de championnat.'
                      : selectedLeague !== 'all'
                      ? 'Aucune rencontre ne correspond à cette ligue dans cet onglet. Cliquez sur « Toutes les ligues » pour revoir l’ensemble des rencontres.'
                      : 'Aucune donnée n’est actuellement disponible. Les flux sont mis à jour en temps réel.'
                  }
                  onRefresh={handleRefreshFeed}
                  isRefreshing={isRefreshing}
                />
                {selectedLeague !== 'all' && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setSelectedLeague('all')}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#0066ff] border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Voir toutes les ligues
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activeTimeTab === 'live' ? (
                  /* Direct matches list matching mockup */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                    {displayMatches.map((event, index) => (
                      <MatchCard
                        key={`${event.id}-${index}`}
                        event={event}
                        isUpdating={isUpdatingData}
                        isScoreFlashing={Boolean(flashingMatchIds[event.id] && Date.now() < flashingMatchIds[event.id])}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedMatches.map(group => (
                      <div key={group.dateKey} className="space-y-3">
                        {/* En-tête du jour (ex: "Aujourd'hui", "Demain", "Lun 12 Oct") */}
                        <div className="flex items-center justify-between gap-2 px-1 pt-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066ff] shadow-xs">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-sm font-bold text-[#071838] tracking-tight">
                              {group.label}
                            </h3>
                            <span className="text-[11px] font-bold text-[#0066ff] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 font-mono">
                              {group.events.length} {group.events.length > 1 ? 'matchs' : 'match'}
                            </span>
                          </div>
                          <div className="h-px bg-blue-100/80 flex-1 ml-2" />
                        </div>

                        {/* Grille des cartes de matchs pour ce jour */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                          {group.events.map((event, index) => (
                            <MatchCard
                              key={`${event.id}-${index}`}
                              event={event}
                              isUpdating={isUpdatingData}
                              isScoreFlashing={Boolean(flashingMatchIds[event.id] && Date.now() < flashingMatchIds[event.id])}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        ) : null}

      </main>

      {/* Floating / Bottom Bet Slip */}
      <BetSlipDrawer onRequireAuth={() => openAuth('login')} />

      {/* 11. NAVIGATION INFÉRIEURE (Accueil, Direct, Mes paris, Gaming, Menu) */}
      <BottomNav
        onRequireAuth={() => openAuth('login')}
        onOpenMenu={() => setIsSideMenuOpen(true)}
        isMenuOpen={isSideMenuOpen}
      />

      {/* Menu Latéral Coulissant (Side Menu Drawer) */}
      <SideMenuDrawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        onOpenAuth={(mode) => openAuth(mode)}
        onOpenLeagues={() => {
          setIsSideMenuOpen(false);
          setIsLeaguesModalOpen(true);
        }}
        onOpenFavorites={() => {
          setIsSideMenuOpen(false);
          setIsFavoritesModalOpen(true);
        }}
        onOpenSettings={() => {
          setIsSideMenuOpen(false);
          setIsSettingsModalOpen(true);
        }}
      />

      {/* Modal Matchs par ligue (accessible depuis le menu latéral) */}
      <LeaguesModal
        isOpen={isLeaguesModalOpen}
        onClose={() => setIsLeaguesModalOpen(false)}
        selectedLeague={selectedLeague}
        onSelectLeague={(leagueId) => {
          setSelectedLeague(leagueId);
          setIsLeaguesModalOpen(false);
          if (currentView !== 'home') {
            navigateTo('home');
          }
        }}
        leagues={availableLeagues}
        sportName={activeSportFilter !== 'all' ? activeSportFilter : undefined}
      />

      {/* Modal Mes favoris */}
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        onFilterFavoriteMatches={(query) => {
          setSearchQuery(query);
          setIsFavoritesModalOpen(false);
          if (currentView !== 'home') {
            navigateTo('home');
          }
        }}
      />

      {/* Modal Paramètres */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Auth Modal (Connexion / Inscription) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <SportsProvider>
          <BetProvider>
            <MainApp />
          </BetProvider>
        </SportsProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}
