import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  domains: [] as Array<{ key: string; label: string; disabled?: boolean }>,
}));

vi.mock("@/lib/navigation", () => ({
  domains: mockState.domains,
}));

import { ProductFocusCard } from "../product-focus-card";

beforeEach(() => {
  mockState.domains.splice(
    0,
    mockState.domains.length,
    { key: "tasks", label: "Tasks" },
    { key: "wallet", label: "Wallet" },
    { key: "health", label: "Health", disabled: true },
  );
});

describe("ProductFocusCard", () => {
  it("uses singular grammar when only one active domain exists", () => {
    mockState.domains.splice(0, mockState.domains.length, {
      key: "wallet",
      label: "Wallet",
    });

    const markup = renderToStaticMarkup(createElement(ProductFocusCard));

    expect(markup).toContain("1 dominio");
    expect(markup).toContain("Wallet es el modulo activo.");
    expect(markup).not.toContain("Wallet son los modulos activos.");
  });

  it("uses neutral copy when there are no active domains", () => {
    mockState.domains.splice(0, mockState.domains.length);

    const markup = renderToStaticMarkup(createElement(ProductFocusCard));

    expect(markup).toContain("0 dominios");
    expect(markup).toContain("No hay modulos activos");
  });
});
