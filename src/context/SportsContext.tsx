import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { SportEvent } from '../types';
import { sportsDataManager, ScraperBackendStatus } from '../services/sportsData';
import { isExplicitLiveMatch, isExplicitFinishedMatch } from '../utils/liveMatch';
import { sortEventsAscending } from '../utils/sorting';

interface SportsContextType {
  events: SportEvent[];
  liveMatches: SportEvent[];
  getLiveMatches: () => SportEvent[];
  isSyncing: boolean;
  isDataLoaded: boolean;
  backendStatus: ScraperBackendStatus | null;
  triggerScrape: () => Promise<any>;
}

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export const SportsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<SportEvent[]>(() => sportsDataManager.getAllKnownEvents());
  const [isSyncing, setIsSyncing] = useState<boolean>(sportsDataManager.getIsSyncing());
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(() => sportsDataManager.getAllKnownEvents().length > 0);
  const [backendStatus, setBackendStatus] = useState<ScraperBackendStatus | null>(null);

  useEffect(() => {
    // Initial check
    if (events.length > 0) setIsDataLoaded(true);

    // Safety timeout: 2 seconds max loading timeout to prevent infinite gray skeletons
    const safetyTimer = setTimeout(() => {
      setIsDataLoaded(true);
    }, 2000);

    const unsubEvents = sportsDataManager.subscribe(updated => {
      setEvents(updated);
      if (updated.length > 0) setIsDataLoaded(true);
    });
    const unsubStatus = sportsDataManager.subscribeStatus(st => {
      setBackendStatus(st);
    });
    const unsubSync = sportsDataManager.subscribeSync(syncing => {
      setIsSyncing(syncing);
    });
    return () => {
      clearTimeout(safetyTimer);
      unsubEvents();
      unsubStatus();
      unsubSync();
    };
  }, []);

  const getLiveMatches = (): SportEvent[] => {
    return sortEventsAscending(
      events.filter(e => isExplicitLiveMatch(e) && !isExplicitFinishedMatch(e))
    );
  };

  const liveMatches = useMemo(() => getLiveMatches(), [events]);

  const triggerScrape = async () => {
    return await sportsDataManager.triggerScrape();
  };

  return (
    <SportsContext.Provider value={{ events, liveMatches, getLiveMatches, isSyncing, isDataLoaded, backendStatus, triggerScrape }}>
      {children}
    </SportsContext.Provider>
  );
};

export const useSports = (): SportsContextType => {
  const context = useContext(SportsContext);
  if (!context) {
    throw new Error('useSports must be used within a SportsProvider');
  }
  return context;
};
