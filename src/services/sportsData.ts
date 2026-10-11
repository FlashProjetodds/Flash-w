import { SportEvent } from '../types';
import {
  loadSavedEvents,
  saveEvents,
} from './storage';
import { fetchLiveMatches } from './LiveScoreService';

type EventsListener = (events: SportEvent[]) => void;

class SportsDataManager {
  private events: SportEvent[] = [];
  private listeners: Set<EventsListener> = new Set();
  private isSyncing: boolean = false;

  constructor() {
    this.events = loadSavedEvents();
    if (typeof window !== 'undefined') {
      this.fetchFromBackend(); // Initial load
    }
  }

  public subscribe(listener: EventsListener): () => void {
    this.listeners.add(listener);
    queueMicrotask(() => listener(this.events));
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.events));
  }

  public async fetchFromBackend(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      this.isSyncing = true;
      const matches = await fetchLiveMatches();
      if (matches.length > 0) {
        this.events = matches;
        saveEvents(this.events);
        this.notify();
      }
      this.isSyncing = false;
      return { success: true, count: this.events.length };
    } catch (err: any) {
      this.isSyncing = false;
      return { success: false, count: 0, error: err.message };
    }
  }

  public getAllKnownEvents(): SportEvent[] {
    return this.events;
  }

  public getEventById(id: string): SportEvent | undefined {
    return this.events.find(e => e.id === id);
  }
}

export const sportsDataManager = new SportsDataManager();
