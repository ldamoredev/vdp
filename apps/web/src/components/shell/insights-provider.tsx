"use client";

import { useInsightsSSE } from "@/hooks/use-insights-sse";
import { ToastContainer } from "./toast-container";

/**
 * Initializes the SSE connection for real-time insights
 * and renders the toast container for notifications.
 *
 * Place once in the layout — handles everything.
 */
export function InsightsProvider() {
  useInsightsSSE();
  return <ToastContainer />;
}
