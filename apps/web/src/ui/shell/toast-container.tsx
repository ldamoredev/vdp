import { useNavigate } from "react-router";

import { useNotifications } from "@/lib/notification-store";
import { notificationStore, type Notification } from "@/lib/notification-store";
import { X, Trophy, AlertTriangle, Lightbulb } from "lucide-react";

function readString(metadata: Notification["metadata"], key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

const iconMap = {
  achievement: Trophy,
  warning: AlertTriangle,
  suggestion: Lightbulb,
} as const;

const colorMap = {
  achievement: {
    icon: "text-[var(--accent-green)]",
    borderColor: "var(--accent-green)",
    glow: "var(--accent-green-glow)",
  },
  warning: {
    icon: "text-[var(--accent-amber)]",
    borderColor: "var(--accent-amber)",
    glow: "var(--amber-soft-bg)",
  },
  suggestion: {
    icon: "text-[var(--accent-purple)]",
    borderColor: "var(--accent-purple)",
    glow: "var(--purple-soft-bg)",
  },
} as const;

function Toast({ notification }: { notification: Notification }) {
  const Icon = iconMap[notification.type];
  const colors = colorMap[notification.type];
  const navigate = useNavigate();

  const actionHref = readString(notification.metadata, "actionHref");
  const actionLabel = readString(notification.metadata, "actionLabel");

  return (
    <div
      className="animate-toast-in glass-card-static flex items-start gap-3 p-4 pr-3 max-w-sm border-l-2"
      style={{
        borderLeftColor: colors.borderColor,
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

        {actionHref && actionLabel && (
          <button
            type="button"
            onClick={() => {
              navigate(actionHref);
              notificationStore.dismiss(notification.id);
            }}
            className="mt-2 inline-flex items-center rounded-lg bg-[var(--hover-overlay-strong)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent-glow)] hover:text-[var(--accent)]"
          >
            {actionLabel}
          </button>
        )}
      </div>

      <button
        onClick={() => notificationStore.dismiss(notification.id)}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--foreground-muted)] transition-all hover:bg-[var(--hover-overlay-strong)] hover:text-[var(--foreground)]"
        aria-label="Cerrar notificación"
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
    <div className="pointer-events-auto fixed left-4 right-4 top-20 z-[100] flex flex-col gap-2 md:left-auto md:right-6 md:top-auto md:bottom-6">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} />
      ))}
    </div>
  );
}
