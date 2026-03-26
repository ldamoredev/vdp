"use client";

import { useEffect, useRef } from "react";
import { notificationStore, type Notification } from "@/lib/notification-store";

const SSE_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1") +
  "/tasks/insights/stream";

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

function getSseUrl(): string {
  if (typeof document === "undefined") return SSE_BASE;
  const match = document.cookie.match(/(?:^|;\s*)access_secret=([^;]*)/);
  const secret = match ? decodeURIComponent(match[1]) : null;
  if (!secret) return SSE_BASE;
  const sep = SSE_BASE.includes("?") ? "&" : "?";
  return `${SSE_BASE}${sep}api_key=${encodeURIComponent(secret)}`;
}

/**
 * Connects to the SSE insights stream.
 * Auto-reconnects with exponential backoff on disconnect.
 * Pushes incoming insights into the notification store.
 */
export function useInsightsSSE() {
  const retryCount = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let mounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (!mounted) return;

      const es = new EventSource(getSseUrl());
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCount.current = 0;
      };

      // Live insight events
      es.addEventListener("insight", (e) => {
        try {
          const insight = JSON.parse(e.data) as Notification;
          notificationStore.add(insight);
        } catch {
          // Ignore malformed data
        }
      });

      // Initial snapshot (unread insights on connect)
      es.addEventListener("snapshot", (e) => {
        try {
          const snapshot = JSON.parse(e.data) as {
            unread: Notification[];
          };
          // Show max 3 from snapshot to avoid flooding
          snapshot.unread.slice(0, 3).forEach((insight) => {
            notificationStore.add(insight);
          });
        } catch {
          // Ignore
        }
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        if (!mounted) return;

        // Exponential backoff
        const delay = Math.min(
          RECONNECT_DELAY_MS * Math.pow(2, retryCount.current),
          MAX_RECONNECT_DELAY_MS
        );
        retryCount.current += 1;

        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);
}
