import { describe, expect, it } from "vitest";
import { shouldAutoFireBrief, type AutoBriefGateArgs } from "../auto-brief-gate";

function baseArgs(overrides: Partial<AutoBriefGateArgs> = {}): AutoBriefGateArgs {
  return {
    pathname: "/home",
    domainKey: "tasks",
    hasDomainAgent: true,
    agentChatEnabled: true,
    briefAlreadyRequested: false,
    isLoadingHistory: false,
    hasMessages: false,
    isStreaming: false,
    alreadyFiredThisMount: false,
    ...overrides,
  };
}

describe("shouldAutoFireBrief", () => {
  it("fires the morning surface on /home when every gate is open", () => {
    expect(shouldAutoFireBrief(baseArgs())).toBe("morning");
  });

  it("fires the evening surface on /review", () => {
    expect(shouldAutoFireBrief(baseArgs({ pathname: "/review" }))).toBe("evening");
  });

  it("never fires outside /home or /review", () => {
    expect(shouldAutoFireBrief(baseArgs({ pathname: "/settings" }))).toBeNull();
  });

  it("never fires outside the Tasks domain (Wallet/Health don't have the brief prompt)", () => {
    expect(shouldAutoFireBrief(baseArgs({ domainKey: "wallet" }))).toBeNull();
  });

  it("never fires without a domain agent or with agent chat disabled", () => {
    expect(shouldAutoFireBrief(baseArgs({ hasDomainAgent: false }))).toBeNull();
    expect(shouldAutoFireBrief(baseArgs({ agentChatEnabled: false }))).toBeNull();
  });

  it("never fires once today's brief was already requested", () => {
    expect(shouldAutoFireBrief(baseArgs({ briefAlreadyRequested: true }))).toBeNull();
  });

  it("never fires while history is loading, mid-stream, or with existing messages", () => {
    expect(shouldAutoFireBrief(baseArgs({ isLoadingHistory: true }))).toBeNull();
    expect(shouldAutoFireBrief(baseArgs({ hasMessages: true }))).toBeNull();
    expect(shouldAutoFireBrief(baseArgs({ isStreaming: true }))).toBeNull();
  });

  it("never fires twice in the same mount", () => {
    expect(shouldAutoFireBrief(baseArgs({ alreadyFiredThisMount: true }))).toBeNull();
  });
});
