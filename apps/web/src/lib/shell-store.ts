"use client";

import { createStore } from "./create-store";

const store = createStore(false);

export const shellStore = {
  getIsOpen: store.getState,
  toggle: () => store.setState((open) => !open),
  open: () => store.setState(true),
  close: () => store.setState(false),
  subscribe: store.subscribe,
};
