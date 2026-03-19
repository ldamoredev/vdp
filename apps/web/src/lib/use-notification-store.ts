"use client";

import { useSyncExternalStore } from "react";
import { notificationStore } from "./notification-store";

export function useNotifications() {
  return useSyncExternalStore(
    notificationStore.subscribe,
    notificationStore.getAll,
    notificationStore.getAll
  );
}
