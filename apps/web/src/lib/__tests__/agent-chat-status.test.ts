import { describe, expect, it } from "vitest";

import { agentChatDisabledMessage, normalizeAgentChatStatus } from "../agent-chat-status";

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

describe("agentChatDisabledMessage", () => {
  it("shows specific copy when chat is disabled by an administrator", () => {
    expect(agentChatDisabledMessage({ enabled: false, reason: "chat_disabled_by_admin" }))
      .toBe("El administrador desactivó el chat IA para tu cuenta.");
  });
});
