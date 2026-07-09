import { afterEach, describe, expect, it } from "vitest";

import { chatStore } from "../chat-store";

describe("chatStore", () => {
  afterEach(() => {
    const request = chatStore.getLaunchRequest();
    if (request) chatStore.consumeLaunchRequest(request.id);
    chatStore.close();
  });

  it("opens the panel with a one-shot launch request", () => {
    chatStore.close();

    chatStore.openWithLaunchRequest({
      domainKey: "tasks",
      starterMessage: "Desglosá el proyecto p1.",
      newConversation: true,
    });

    const request = chatStore.getLaunchRequest();
    expect(chatStore.getIsOpen()).toBe(true);
    expect(request).toEqual({
      id: expect.any(String),
      domainKey: "tasks",
      starterMessage: "Desglosá el proyecto p1.",
      newConversation: true,
    });

    expect(chatStore.consumeLaunchRequest(request!.id)).toEqual(request);
    expect(chatStore.getLaunchRequest()).toBeNull();
  });
});
