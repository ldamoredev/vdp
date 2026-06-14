import { describe, expect, it } from "vitest";

import { normalizeAgentChatStatus } from "../agent-chat-status";

describe("normalizeAgentChatStatus", () => {
  it("returns enabled only when the health payload explicitly enables chat", () => {
    expect(normalizeAgentChatStatus({ agentChat: { enabled: true } })).toEqual({
      enabled: true,
    });
  });

  it("fails closed when the health payload is missing or malformed", () => {
    expect(normalizeAgentChatStatus({})).toEqual({
      enabled: false,
      reason: "agent_status_unavailable",
    });
    expect(normalizeAgentChatStatus({ agentChat: { enabled: false, reason: "x" } })).toEqual({
      enabled: false,
      reason: "x",
    });
  });
});
