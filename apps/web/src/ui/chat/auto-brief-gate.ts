export type DailyBriefSurface = "morning" | "evening" | "weekly";

export interface AutoBriefGateArgs {
  pathname: string;
  domainKey: string;
  hasDomainAgent: boolean;
  agentChatEnabled: boolean;
  briefAlreadyRequested: boolean;
  // D6b: independent of briefAlreadyRequested — keyed to the ISO week, only
  // checked on /home.
  weeklyBriefAlreadyRequested: boolean;
  isLoadingHistory: boolean;
  hasMessages: boolean;
  isStreaming: boolean;
  alreadyFiredThisMount: boolean;
}

/**
 * Pure decision of whether ChatPanel should auto-fire a brief prompt right
 * now, and which surface. Extracted from the component so the gate logic is
 * testable without mounting React/Core/router (D6a, extended in D6b).
 */
export function shouldAutoFireBrief(args: AutoBriefGateArgs): DailyBriefSurface | null {
  if (args.domainKey !== "tasks") return null;
  if (!args.hasDomainAgent) return null;
  if (!args.agentChatEnabled) return null;
  if (args.isLoadingHistory) return null;
  if (args.hasMessages) return null;
  if (args.isStreaming) return null;
  if (args.alreadyFiredThisMount) return null;

  if (args.pathname === "/home") {
    // Weekly takes priority over the daily morning brief on a shared visit
    // (e.g. the first open on a Monday) — deliberate simplification, not
    // "smart merging" of two auto-fired turns into one.
    if (!args.weeklyBriefAlreadyRequested) return "weekly";
    return args.briefAlreadyRequested ? null : "morning";
  }

  if (args.pathname === "/review") {
    return args.briefAlreadyRequested ? null : "evening";
  }

  return null;
}
