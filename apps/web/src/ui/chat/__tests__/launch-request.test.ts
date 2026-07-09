import { describe, expect, it } from "vitest";

import type { ChatLaunchRequest } from "@/lib/chat-store";
import { resolveLaunchRequestDomainKey } from "../launch-request";

function request(domainKey: string): ChatLaunchRequest {
  return {
    id: "launch-1",
    domainKey,
    starterMessage: "Abrir chat.",
    newConversation: true,
  };
}

describe("resolveLaunchRequestDomainKey", () => {
  it("lets a valid launch request select Tasks even from a Projects route", () => {
    expect(
      resolveLaunchRequestDomainKey({
        launchRequest: request("tasks"),
        routeDomainKey: "projects",
        fallbackDomainKey: "wallet",
      }),
    ).toBe("tasks");
  });

  it("ignores launch requests for domains without an agent", () => {
    expect(
      resolveLaunchRequestDomainKey({
        launchRequest: request("projects"),
        launchedDomainKey: null,
        routeDomainKey: "projects",
        fallbackDomainKey: "wallet",
      }),
    ).toBe("projects");
  });

  it("keeps the launched agent selected after the request was consumed", () => {
    expect(
      resolveLaunchRequestDomainKey({
        launchRequest: null,
        launchedDomainKey: "tasks",
        routeDomainKey: "projects",
        fallbackDomainKey: "wallet",
      }),
    ).toBe("tasks");
  });
});
