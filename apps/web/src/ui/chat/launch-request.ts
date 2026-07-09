import type { ChatLaunchRequest } from "@/lib/chat-store";
import { domainHasAgent, getDomainConfig, type DomainKey } from "@/lib/navigation";

export function resolveLaunchRequestDomainKey(args: {
  launchRequest: ChatLaunchRequest | null;
  launchedDomainKey?: DomainKey | null;
  routeDomainKey: DomainKey | null;
  fallbackDomainKey: DomainKey;
}): DomainKey {
  const launchDomainKey = getAgentDomainKey(args.launchRequest?.domainKey ?? null);
  if (launchDomainKey) return launchDomainKey;

  const launchedDomainKey = getAgentDomainKey(args.launchedDomainKey ?? null);
  if (launchedDomainKey) return launchedDomainKey;

  return args.routeDomainKey ?? args.fallbackDomainKey;
}

export function getLaunchRequestAgentDomainKey(launchRequest: ChatLaunchRequest | null): DomainKey | null {
  return getAgentDomainKey(launchRequest?.domainKey ?? null);
}

function getAgentDomainKey(domainKey: string | null): DomainKey | null {
  const domain = domainKey ? getDomainConfig(domainKey) : null;
  if (!domain || domain.disabled || !domainHasAgent(domain)) return null;
  return domain.key;
}
