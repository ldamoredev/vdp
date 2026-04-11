import { describe, expect, it, vi } from "vitest";
import {
  ONBOARDING_CHROME_ATTRIBUTE,
  ONBOARDING_STEPS,
  ONBOARDING_STORAGE_KEY,
  completeOnboarding,
  hasCompletedOnboarding,
  setOnboardingChromeState,
  shouldOpenOnboarding,
} from "../onboarding-storage";

describe("onboarding storage", () => {
  it("treats empty storage as not completed", () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };

    expect(hasCompletedOnboarding(storage)).toBe(false);
    expect(storage.getItem).toHaveBeenCalledWith(ONBOARDING_STORAGE_KEY);
  });

  it("marks onboarding as complete using the shared key", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    completeOnboarding(storage);

    expect(storage.setItem).toHaveBeenCalledWith(ONBOARDING_STORAGE_KEY, "true");
  });

  it("derives modal visibility from storage completion state", () => {
    expect(
      shouldOpenOnboarding({
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      }),
    ).toBe(true);

    expect(
      shouldOpenOnboarding({
        getItem: vi.fn(() => "true"),
        setItem: vi.fn(),
      }),
    ).toBe(false);
  });

  it("defines the three product onboarding steps in order", () => {
    expect(ONBOARDING_STEPS.map((step) => step.title)).toEqual([
      "Tus tareas",
      "Tu wallet",
      "Tu asistente",
    ]);
    expect(ONBOARDING_STEPS).toHaveLength(3);
  });

  it("toggles the onboarding chrome attribute for shell dimming", () => {
    const root = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    };

    setOnboardingChromeState(root, true);
    setOnboardingChromeState(root, false);

    expect(root.setAttribute).toHaveBeenCalledWith(
      ONBOARDING_CHROME_ATTRIBUTE,
      "true",
    );
    expect(root.removeAttribute).toHaveBeenCalledWith(
      ONBOARDING_CHROME_ATTRIBUTE,
    );
  });
});
