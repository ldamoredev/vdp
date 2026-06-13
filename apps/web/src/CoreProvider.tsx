import { createContext, useContext, useState, type ReactNode } from "react";

import { Core } from "@/core/Core";

const CoreContext = createContext<Core | null>(null);

/**
 * Builds the Core once and exposes it to the tree. The React bridge lives here
 * (not in core/) so the core/ layer stays free of React. Accepts an injected
 * core for tests.
 */
export function CoreProvider({ core, children }: { core?: Core; children: ReactNode }) {
  const [instance] = useState(() => core ?? new Core());
  return <CoreContext.Provider value={instance}>{children}</CoreContext.Provider>;
}

export function useCore(): Core {
  const core = useContext(CoreContext);
  if (!core) throw new Error("useCore must be used within a CoreProvider");
  return core;
}
