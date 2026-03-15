"use client";

let isOpen = false;
let listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const chatStore = {
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
