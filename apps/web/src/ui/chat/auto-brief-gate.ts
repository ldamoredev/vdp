export type DailyBriefSurface = "morning" | "evening";

export interface AutoBriefGateArgs {
  pathname: string;
  domainKey: string;
  hasDomainAgent: boolean;
  agentChatEnabled: boolean;
  briefAlreadyRequested: boolean;
  isLoadingHistory: boolean;
  hasMessages: boolean;
  isStreaming: boolean;
  alreadyFiredThisMount: boolean;
}

/**
 * D6a: pure decision of whether ChatPanel should auto-fire the R3b brief
 * prompt right now, and which surface. Extracted from the component so the
 * gate logic is testable without mounting React/Core/router.
 */
export function shouldAutoFireBrief(args: AutoBriefGateArgs): DailyBriefSurface | null {
  const surface: DailyBriefSurface | null =
    args.pathname === "/home" ? "morning" : args.pathname === "/review" ? "evening" : null;

  if (!surface) return null;
  if (args.domainKey !== "tasks") return null;
  if (!args.hasDomainAgent) return null;
  if (!args.agentChatEnabled) return null;
  if (args.briefAlreadyRequested) return null;
  if (args.isLoadingHistory) return null;
  if (args.hasMessages) return null;
  if (args.isStreaming) return null;
  if (args.alreadyFiredThisMount) return null;

  return surface;
}
