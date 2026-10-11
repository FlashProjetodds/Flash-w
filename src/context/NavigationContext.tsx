import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppView } from '../types';

interface NavState {
  view: AppView;
  selectedEventId?: string;
  selectedSport?: string;
}

interface NavigationContextType {
  currentView: AppView;
  selectedEventId?: string;
  selectedSport?: string;
  canGoBack: boolean;
  navigateTo: (view: AppView, params?: { eventId?: string; sport?: string }) => void;
  goBack: () => void;
  openMatchDetail: (eventId: string) => void;
  openSportCategory: (sport: string) => void;
  resetToPublicHome: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navState, setNavState] = useState<NavState>({ view: 'home' });
  const [historyStack, setHistoryStack] = useState<NavState[]>([{ view: 'home' }]);

  const navigateTo = useCallback((view: AppView, params?: { eventId?: string; sport?: string }) => {
    const nextState: NavState = {
      view,
      selectedEventId: params?.eventId,
      selectedSport: params?.sport,
    };

    setHistoryStack(prev => [...prev, nextState]);
    setNavState(nextState);

    // Push into browser history for Android hardware back button capture
    try {
      window.history.pushState({ ...nextState, stackDepth: historyStack.length + 1 }, '');
    } catch {}
  }, [historyStack.length]);

  const goBack = useCallback(() => {
    if (historyStack.length > 1) {
      const newStack = [...historyStack];
      newStack.pop(); // remove current
      const prevState = newStack[newStack.length - 1];
      setHistoryStack(newStack);
      setNavState(prevState);
    } else {
      // Logical fallback if at stack base
      if (navState.view === 'match_detail') {
        const fallback: NavState = { view: 'home' };
        setNavState(fallback);
        setHistoryStack([fallback]);
      } else if (navState.view !== 'home') {
        const fallback: NavState = { view: 'home' };
        setNavState(fallback);
        setHistoryStack([fallback]);
      }
    }
  }, [historyStack, navState.view]);

  // Intercept Android / browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (historyStack.length > 1) {
        const newStack = [...historyStack];
        newStack.pop();
        const prevState = newStack[newStack.length - 1];
        setHistoryStack(newStack);
        setNavState(prevState);
      } else if (navState.view !== 'home') {
        const fallback: NavState = { view: 'home' };
        setNavState(fallback);
        setHistoryStack([fallback]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [historyStack, navState.view]);

  const openMatchDetail = useCallback((eventId: string) => {
    navigateTo('match_detail', { eventId });
  }, [navigateTo]);

  const openSportCategory = useCallback((sport: string) => {
    navigateTo('sports', { sport });
  }, [navigateTo]);

  const resetToPublicHome = useCallback(() => {
    const homeState: NavState = { view: 'home' };
    setNavState(homeState);
    setHistoryStack([homeState]);
    try {
      window.history.replaceState({ view: 'home', stackDepth: 1 }, '', '/');
    } catch {}
  }, []);

  const canGoBack = historyStack.length > 1 || navState.view !== 'home';

  return (
    <NavigationContext.Provider
      value={{
        currentView: navState.view,
        selectedEventId: navState.selectedEventId,
        selectedSport: navState.selectedSport,
        canGoBack,
        navigateTo,
        goBack,
        openMatchDetail,
        openSportCategory,
        resetToPublicHome,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export function isPrivateView(view: AppView): boolean {
  return [
    'match_detail',
    'gaming',
    'my_bets',
    'profile',
    'balance',
    'admin_balance',
    'admin_sources',
    'admin_dashboard',
  ].includes(view);
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
