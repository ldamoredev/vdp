"use client";

// ─── Types ─────────────────────────────────────────

export type NotificationType = "achievement" | "warning" | "suggestion";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ─── Store ─────────────────────────────────────────

let notifications: Notification[] = [];
let listeners = new Set<() => void>();

const MAX_NOTIFICATIONS = 10;
const AUTO_DISMISS_MS = 6000;

function emit() {
  listeners.forEach((l) => l());
}

export const notificationStore = {
  getAll: () => notifications,

  add: (notification: Notification) => {
    notifications = [notification, ...notifications].slice(0, MAX_NOTIFICATIONS);
    emit();

    // Auto-dismiss after timeout
    setTimeout(() => {
      notificationStore.dismiss(notification.id);
    }, AUTO_DISMISS_MS);
  },

  dismiss: (id: string) => {
    const prev = notifications;
    notifications = notifications.filter((n) => n.id !== id);
    if (notifications !== prev) emit();
  },

  clear: () => {
    notifications = [];
    emit();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
