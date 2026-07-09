import { useSyncExternalStore } from "react";
import { createStore } from "./create-store";

export interface ChatLaunchRequest {
  id: string;
  domainKey: string;
  starterMessage: string;
  newConversation: boolean;
}

export type NewChatLaunchRequest = Omit<ChatLaunchRequest, "id">;

const openStore = createStore(false);
const launchRequestStore = createStore<ChatLaunchRequest | null>(null);
let nextLaunchRequestId = 0;

export const chatStore = {
  getIsOpen: openStore.getState,
  toggle: () => openStore.setState((open) => !open),
  open: () => openStore.setState(true),
  close: () => openStore.setState(false),
  subscribe: openStore.subscribe,
  getLaunchRequest: launchRequestStore.getState,
  subscribeToLaunchRequest: launchRequestStore.subscribe,
  openWithLaunchRequest: (request: NewChatLaunchRequest) => {
    nextLaunchRequestId += 1;
    launchRequestStore.setState({
      ...request,
      id: `chat-launch-${nextLaunchRequestId}`,
    });
    openStore.setState(true);
  },
  consumeLaunchRequest: (id: string) => {
    const request = launchRequestStore.getState();
    if (!request || request.id !== id) return null;
    launchRequestStore.setState(null);
    return request;
  },
};

export function useChatOpen() {
  return useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getIsOpen,
    chatStore.getIsOpen
  );
}

export function useChatLaunchRequest() {
  return useSyncExternalStore(
    chatStore.subscribeToLaunchRequest,
    chatStore.getLaunchRequest,
    chatStore.getLaunchRequest
  );
}
