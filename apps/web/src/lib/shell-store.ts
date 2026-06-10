"use client";

import { useSyncExternalStore } from "react";
import { createStore } from "./create-store";

const store = createStore(false);

export const shellStore = {
  getIsOpen: store.getState,
  toggle: () => store.setState((open) => !open),
  open: () => store.setState(true),
  close: () => store.setState(false),
  subscribe: store.subscribe,
};

export function useSidebarOpen(): boolean {
  return useSyncExternalStore(
    shellStore.subscribe,
    shellStore.getIsOpen,
    () => false, // SSR: always closed
  );
}
