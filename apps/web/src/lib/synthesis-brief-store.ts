import { useSyncExternalStore } from "react";
import { createStore } from "./create-store";

interface SynthesisBriefState {
  home: string | null;
  review: string | null;
  // D6a: default true — until a presenter proves otherwise for *today*, ChatPanel
  // must assume the brief was already requested, so it never auto-fires before
  // real data has loaded.
  homeBriefRequested: boolean;
  reviewBriefRequested: boolean;
}

const store = createStore<SynthesisBriefState>({
  home: null,
  review: null,
  homeBriefRequested: true,
  reviewBriefRequested: true,
});

export const synthesisBriefStore = {
  setHomeBrief: (text: string) => store.setState((state) => ({ ...state, home: text })),
  clearHomeBrief: () => store.setState((state) => ({ ...state, home: null })),
  setReviewBrief: (text: string) => store.setState((state) => ({ ...state, review: text })),
  clearReviewBrief: () => store.setState((state) => ({ ...state, review: null })),
  setHomeBriefRequested: (requested: boolean) =>
    store.setState((state) => ({ ...state, homeBriefRequested: requested })),
  setReviewBriefRequested: (requested: boolean) =>
    store.setState((state) => ({ ...state, reviewBriefRequested: requested })),
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

/** Whether today's brief was already requested for the surface at this pathname (D6a). */
export function useSynthesisBriefRequested(pathname: string): boolean {
  const state = useSyncExternalStore(
    synthesisBriefStore.subscribe,
    synthesisBriefStore.getState,
    synthesisBriefStore.getState,
  );

  if (pathname === "/home") return state.homeBriefRequested;
  if (pathname === "/review") return state.reviewBriefRequested;
  return true;
}
