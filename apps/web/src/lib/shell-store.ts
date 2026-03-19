"use client";

// Reactive store for mobile sidebar drawer state
// Mirrors chat-store.ts pattern exactly
let isOpen = false;
let listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const shellStore = {
  getIsOpen: () => isOpen,
  toggle: () => {
    isOpen = !isOpen;
    emit();
  },
  open: () => {
    isOpen = true;
    emit();
  },
  close: () => {
    isOpen = false;
    emit();
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
