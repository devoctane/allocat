"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import type { TourContextValue, TourPage, TourState } from "./types";

const STORAGE_KEY = "allocat-tour-state";
const DEFAULT_STATE: TourState = { enabled: true, seenPages: [] };

function loadState(): TourState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<TourState>;
    return {
      enabled: parsed.enabled ?? true,
      seenPages: parsed.seenPages ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: TourState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const TourContext = createContext<TourContextValue>({
  enabled: true,
  seenPages: [],
  isPageTourActive: () => false,
  markSeen: () => {},
  setEnabled: () => {},
  resetTour: () => {},
});

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TourState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const isPageTourActive = useCallback(
    (page: TourPage) => {
      if (!hydrated) return false;
      return state.enabled && !state.seenPages.includes(page);
    },
    [state, hydrated]
  );

  const markSeen = useCallback((page: TourPage) => {
    setState((prev) => {
      if (prev.seenPages.includes(page)) return prev;
      const next: TourState = {
        ...prev,
        seenPages: [...prev.seenPages, page],
      };
      saveState(next);
      return next;
    });
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setState((prev) => {
      const next: TourState = { ...prev, enabled };
      saveState(next);
      return next;
    });
  }, []);

  const resetTour = useCallback(() => {
    setState((prev) => {
      const next: TourState = { ...prev, seenPages: [] };
      saveState(next);
      return next;
    });
  }, []);

  return (
    <TourContext.Provider
      value={{ ...state, isPageTourActive, markSeen, setEnabled, resetTour }}
    >
      {children}
    </TourContext.Provider>
  );
}
