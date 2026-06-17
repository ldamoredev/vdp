import { createContext, useContext, useState, type ReactNode } from "react";

import { Core } from "@/core/Core";
import { createAppCore } from "@/createAppCore";
import { confirmSessionAfterUnauthorized } from "@/lib/auth";

const CORE_CONTEXT_KEY = "__vdpCoreContext";

const globalContextRegistry = globalThis as typeof globalThis & {
  [CORE_CONTEXT_KEY]?: ReturnType<typeof createContext<Core | null>>;
};

const CoreContext =
  globalContextRegistry[CORE_CONTEXT_KEY] ?? createContext<Core | null>(null);

globalContextRegistry[CORE_CONTEXT_KEY] = CoreContext;

/**
 * Builds the app Core once (with every feature module registered) and exposes
 * it to the tree. The React bridge lives here (not in core/) so the core/
 * layer stays free of React. Accepts an injected core for tests.
 */
export function CoreProvider({ core, children }: { core?: Core; children: ReactNode }) {
  const [instance] = useState(() =>
    core ?? createAppCore({ onUnauthorized: () => void confirmSessionAfterUnauthorized() }),
  );
  return <CoreContext.Provider value={instance}>{children}</CoreContext.Provider>;
}

export function useCore(): Core {
  const core = useContext(CoreContext);
  if (!core) throw new Error("useCore must be used within a CoreProvider");
  return core;
}
