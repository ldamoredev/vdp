export const ONBOARDING_STORAGE_KEY = "vdp_onboarded";
export const ONBOARDING_CHROME_ATTRIBUTE = "data-onboarding-open";

export type OnboardingStep = {
  readonly title: string;
  readonly emoji: string;
  readonly description: string;
  readonly accent: "violet" | "blue" | "emerald";
};

type OnboardingStorage = Pick<Storage, "getItem" | "setItem">;

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    title: "Tus tareas",
    emoji: "\ud83d\udccb",
    description:
      "Organizá tu día con tareas inteligentes. El asistente te ayuda a priorizar y revisar.",
    accent: "violet",
  },
  {
    title: "Tu wallet",
    emoji: "\ud83d\udcb0",
    description:
      "Registrá gastos e ingresos rápido. Detectamos patrones y te avisamos.",
    accent: "blue",
  },
  {
    title: "Tu asistente",
    emoji: "\ud83e\udd16",
    description:
      "Chateá con IA que conoce tus tareas y finanzas. Te sugiere, te alerta, y te ayuda a decidir.",
    accent: "emerald",
  },
];

export function hasCompletedOnboarding(storage: OnboardingStorage): boolean {
  return storage.getItem(ONBOARDING_STORAGE_KEY) === "true";
}

export function shouldOpenOnboarding(storage: OnboardingStorage): boolean {
  return !hasCompletedOnboarding(storage);
}

export function completeOnboarding(storage: OnboardingStorage): void {
  storage.setItem(ONBOARDING_STORAGE_KEY, "true");
}

export function setOnboardingChromeState(
  root: Pick<HTMLElement, "setAttribute" | "removeAttribute">,
  open: boolean,
): void {
  if (open) {
    root.setAttribute(ONBOARDING_CHROME_ATTRIBUTE, "true");
    return;
  }

  root.removeAttribute(ONBOARDING_CHROME_ATTRIBUTE);
}
