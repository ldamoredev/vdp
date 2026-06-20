import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { ExecutionQueueViewModel } from "@/ui/models/tasks/ExecutionQueueViewModel";

const model: ExecutionQueueViewModel = {
  filter: "focus",
  filterOptions: [
    { key: "focus", label: "Focus", count: 0 },
    { key: "pending", label: "Pendientes", count: 0 },
    { key: "done", label: "Hechas", count: 0 },
    { key: "all", label: "Todas", count: 0 },
  ],
  rows: [],
  isLoading: true,
  error: false,
};

const presenter = {
  model,
  setFilter: vi.fn(),
  complete: vi.fn(),
  carryOver: vi.fn(),
  discard: vi.fn(),
  delete: vi.fn(),
  openDetail: vi.fn(),
  setExpandedActions: vi.fn(),
};

vi.mock("../useExecutionQueuePresenter", () => ({
  useExecutionQueuePresenter: () => presenter,
}));

import { ExecutionQueue } from "../ExecutionQueue";

describe("ExecutionQueue", () => {
  it("shows row-shaped skeletons while loading instead of the empty state", () => {
    const markup = renderToStaticMarkup(createElement(ExecutionQueue));

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Cargando tareas"');
    expect(markup.match(/skeleton/g)?.length).toBeGreaterThanOrEqual(3);
    expect(markup).not.toContain("Sin tareas urgentes");
  });
});
