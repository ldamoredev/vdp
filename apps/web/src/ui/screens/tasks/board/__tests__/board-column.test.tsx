import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BoardColumn } from "../board-column";

describe("BoardColumn", () => {
  it("renders the header and a dashed empty state when it has no cards", () => {
    const markup = renderToStaticMarkup(
      createElement(BoardColumn, {
        title: "Pendientes",
        count: 0,
        tone: "accent",
        empty: "Nada pendiente acá",
      }),
    );

    expect(markup).toContain("Pendientes");
    expect(markup).toContain("border-dashed");
    expect(markup).toContain("Nada pendiente acá");
    expect(markup).toContain("bg-[var(--accent)]"); // status dot tone
  });

  it("highlights as a drop target with an accent ring", () => {
    const markup = renderToStaticMarkup(
      createElement(BoardColumn, { title: "Hechas", tone: "green", isDropTarget: true }),
    );

    expect(markup).toContain("border-[var(--accent)]");
    expect(markup).toContain("shadow-[0_0_0_3px_var(--accent-glow)]");
  });

  it("renders cards instead of the empty state", () => {
    const markup = renderToStaticMarkup(
      createElement(
        BoardColumn,
        { title: "Pendientes", empty: "Nada pendiente" },
        createElement("article", null, "una tarjeta"),
      ),
    );

    expect(markup).toContain("una tarjeta");
    expect(markup).not.toContain("Nada pendiente");
    expect(markup).not.toContain("border-dashed");
  });

  it("shows the add affordance only when onAdd is provided", () => {
    const without = renderToStaticMarkup(createElement(BoardColumn, { title: "Hechas" }));
    const withAdd = renderToStaticMarkup(
      createElement(BoardColumn, { title: "Pendientes", onAdd: () => {} }),
    );

    expect(without).not.toContain('aria-label="Crear tarea"');
    expect(withAdd).toContain('aria-label="Crear tarea"');
  });
});
