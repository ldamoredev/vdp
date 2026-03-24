"use client";

type Listener = () => void;

export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener>();

  function emit() {
    listeners.forEach((l) => l());
  }

  return {
    getState: () => state,
    setState: (updater: T | ((prev: T) => T)) => {
      state =
        typeof updater === "function"
          ? (updater as (prev: T) => T)(state)
          : updater;
      emit();
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
