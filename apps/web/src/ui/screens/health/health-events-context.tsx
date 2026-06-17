import { createContext, useContext, useState, type ReactNode } from "react";

import { HealthEvents } from "@/ui/events/HealthEvents";

const HEALTH_EVENTS_CONTEXT_KEY = "__vdpHealthEventsContext";

const globalContextRegistry = globalThis as typeof globalThis & {
  [HEALTH_EVENTS_CONTEXT_KEY]?: ReturnType<typeof createContext<HealthEvents | null>>;
};

const HealthEventsContext =
  globalContextRegistry[HEALTH_EVENTS_CONTEXT_KEY] ?? createContext<HealthEvents | null>(null);

globalContextRegistry[HEALTH_EVENTS_CONTEXT_KEY] = HealthEventsContext;

/** Owns one HealthEvents instance shared by the health sections' presenters. */
export function HealthEventsProvider({ children }: { children: ReactNode }) {
  const [events] = useState(() => new HealthEvents());
  return <HealthEventsContext.Provider value={events}>{children}</HealthEventsContext.Provider>;
}

export function useHealthEvents(): HealthEvents {
  const events = useContext(HealthEventsContext);
  if (!events) throw new Error("useHealthEvents must be used within a HealthEventsProvider");
  return events;
}
