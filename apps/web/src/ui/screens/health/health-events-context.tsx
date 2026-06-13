import { createContext, useContext, useState, type ReactNode } from "react";

import { HealthEvents } from "@/ui/events/HealthEvents";

const HealthEventsContext = createContext<HealthEvents | null>(null);

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
