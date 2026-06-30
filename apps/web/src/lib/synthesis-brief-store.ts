import { useSyncExternalStore } from "react";
import { createStore } from "./create-store";

interface SynthesisBriefState {
  home: string | null;
  review: string | null;
}

const store = createStore<SynthesisBriefState>({ home: null, review: null });

export const synthesisBriefStore = {
  setHomeBrief: (text: string) => store.setState((state) => ({ ...state, home: text })),
  clearHomeBrief: () => store.setState((state) => ({ ...state, home: null })),
  setReviewBrief: (text: string) => store.setState((state) => ({ ...state, review: text })),
  clearReviewBrief: () => store.setState((state) => ({ ...state, review: null })),
  subscribe: store.subscribe,
  getState: store.getState,
};

/** Picks the right surface's brief for the current pathname, or null elsewhere. */
export function useSynthesisBrief(pathname: string): string | null {
  const state = useSyncExternalStore(
    synthesisBriefStore.subscribe,
    synthesisBriefStore.getState,
    synthesisBriefStore.getState,
  );

  if (pathname === "/home") return state.home;
  if (pathname === "/review") return state.review;
  return null;
}
