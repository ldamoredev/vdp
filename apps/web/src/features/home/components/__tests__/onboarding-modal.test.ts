import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingModal } from "../onboarding-modal";

beforeEach(() => {
  globalThis.React = React;
});

describe("OnboardingModal", () => {
  it("renders the first welcome step with a next action", () => {
    const markup = renderToStaticMarkup(
      createElement(OnboardingModal, {
        open: true,
        stepIndex: 0,
        onNext: vi.fn(),
      }),
    );

    expect(markup).toContain("Tus tareas");
    expect(markup).toContain("Organizá tu día con tareas inteligentes.");
    expect(markup).toContain("Siguiente");
    expect(markup).toContain("z-[120]");
  });

  it("renders the final step with the start CTA", () => {
    const markup = renderToStaticMarkup(
      createElement(OnboardingModal, {
        open: true,
        stepIndex: 2,
        onNext: vi.fn(),
      }),
    );

    expect(markup).toContain("Tu asistente");
    expect(markup).toContain("Chateá con IA que conoce tus tareas y finanzas.");
    expect(markup).toContain("Empezar");
    expect(markup).toContain('aria-current="step"');
  });

  it("renders nothing when the modal is closed", () => {
    const markup = renderToStaticMarkup(
      createElement(OnboardingModal, {
        open: false,
        stepIndex: 0,
        onNext: vi.fn(),
      }),
    );

    expect(markup).toBe("");
  });
});
