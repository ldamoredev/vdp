import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProductFocusCard } from "../product-focus-card";

describe("ProductFocusCard", () => {
  it("states that Tasks and Wallet are the live modules", () => {
    const markup = renderToStaticMarkup(<ProductFocusCard />);

    expect(markup).toContain("Tasks y Wallet son los modulos activos");
    expect(markup).toContain("2 dominios");
    expect(markup).not.toContain("Pronto");
  });
});
