"use client";

import { useSyncExternalStore } from "react";
import { chatStore } from "./chat-store";

export function useChatOpen() {
  return useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getIsOpen,
    chatStore.getIsOpen
  );
}
