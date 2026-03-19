"use client";

import { useSyncExternalStore } from "react";
import { shellStore } from "./shell-store";

export function useSidebarOpen(): boolean {
  return useSyncExternalStore(
    shellStore.subscribe,
    shellStore.getIsOpen,
    () => false, // SSR: always closed
  );
}
