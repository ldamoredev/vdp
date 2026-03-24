"use client";

import { createStore } from "./create-store";

export type NotificationType = "achievement" | "warning" | "suggestion";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const MAX_NOTIFICATIONS = 10;
const AUTO_DISMISS_MS = 6000;

const store = createStore<Notification[]>([]);

export const notificationStore = {
  getAll: store.getState,

  add: (notification: Notification) => {
    store.setState((prev) => {
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
    });

    setTimeout(() => {
      notificationStore.dismiss(notification.id);
    }, AUTO_DISMISS_MS);
  },

  dismiss: (id: string) => {
    store.setState((prev) => {
      const next = prev.filter((n) => n.id !== id);
      return next.length === prev.length ? prev : next;
    });
  },

  clear: () => store.setState([]),

  subscribe: store.subscribe,
};
