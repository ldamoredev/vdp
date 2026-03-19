"use client";

import { useNotifications } from "@/lib/use-notification-store";
import { notificationStore, type Notification } from "@/lib/notification-store";
import { X, Trophy, AlertTriangle, Lightbulb } from "lucide-react";

const iconMap = {
  achievement: Trophy,
  warning: AlertTriangle,
  suggestion: Lightbulb,
} as const;

const colorMap = {
  achievement: {
    icon: "text-[var(--accent-green)]",
    border: "border-l-[var(--accent-green)]",
    glow: "var(--accent-green-glow)",
  },
  warning: {
    icon: "text-[var(--accent-amber)]",
    border: "border-l-[var(--accent-amber)]",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  suggestion: {
    icon: "text-[var(--accent-purple)]",
    border: "border-l-[var(--accent-purple)]",
    glow: "rgba(168, 85, 247, 0.15)",
  },
} as const;

function Toast({ notification }: { notification: Notification }) {
  const Icon = iconMap[notification.type];
  const colors = colorMap[notification.type];

  return (
    <div
      className="animate-slide-in-right glass-card-static flex items-start gap-3 p-4 pr-3 max-w-sm border-l-2"
      style={{
        borderLeftColor: `var(--accent-${notification.type === "achievement" ? "green" : notification.type === "warning" ? "amber" : "purple"})`,
        boxShadow: `0 4px 16px ${colors.glow}`,
      }}
    >
      <Icon size={18} className={`${colors.icon} mt-0.5 shrink-0`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {notification.title}
        </p>
        <p className="text-xs text-[var(--foreground-muted)] mt-1 line-clamp-2">
          {notification.message}
        </p>
      </div>

      <button
        onClick={() => notificationStore.dismiss(notification.id)}
        className="shrink-0 p-1 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay-strong)] transition-all"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const notifications = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-auto">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} />
      ))}
    </div>
  );
}
