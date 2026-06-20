import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { BoardTaskActions, BoardTaskVM } from "@/ui/models/tasks/BoardViewModel";
import { TaskCard } from "../task-card";

const actions: BoardTaskActions = {
  onComplete: vi.fn(),
  onCarryOver: vi.fn(),
  onDiscard: vi.fn(),
  onOpenDetail: vi.fn(),
};

function task(overrides: Partial<BoardTaskVM> = {}): BoardTaskVM {
  return {
    id: "t1",
    title: "Pagar tarjeta",
    priority: 3,
    domain: "wallet",
    carryOverCount: 0,
    dateLabel: "lun, 13 jun",
    state: "pending",
    isStuck: false,
    busy: false,
    ...overrides,
  };
}

describe("TaskCard", () => {
  it("renders a pending card with badges, scheduled date and one-tap quick actions", () => {
    const markup = renderToStaticMarkup(createElement(TaskCard, { task: task(), actions }));

    expect(markup).toContain("Pagar tarjeta");
    expect(markup).toContain("Alta"); // priority label
    expect(markup).toContain("Finanzas"); // domain label
    expect(markup).toContain("lun, 13 jun"); // scheduled date chip
    expect(markup).toContain("font-data");
    expect(markup).toContain('aria-label="Marcar como hecha"');
    expect(markup).toContain('aria-label="Reprogramar a mañana"');
    expect(markup).toContain('aria-label="Descartar"');
    expect(markup).toContain('aria-label="Ver detalle"');
  });

  it("surfaces a stuck card with the red rail and soft surface", () => {
    const markup = renderToStaticMarkup(
      createElement(TaskCard, { task: task({ isStuck: true, carryOverCount: 3 }), actions }),
    );

    expect(markup).toContain("bg-[var(--stuck-rail)]");
    expect(markup).toContain("w-[3px]");
    expect(markup).toContain("border-[var(--red-soft-border)]");
    expect(markup).toContain("bg-[var(--red-soft-bg)]");
  });

  it("dims a done card, strikes the title and hides the quick actions", () => {
    const markup = renderToStaticMarkup(createElement(TaskCard, { task: task({ state: "done" }), actions }));

    expect(markup).toContain("line-through");
    expect(markup).toContain("opacity-65");
    expect(markup).not.toContain('aria-label="Marcar como hecha"');
  });

  it("shows the grip handle only when draggable", () => {
    const plain = renderToStaticMarkup(createElement(TaskCard, { task: task(), actions }));
    const drag = renderToStaticMarkup(createElement(TaskCard, { task: task(), actions, draggable: true }));

    expect(plain).not.toContain("cursor-grab");
    expect(drag).toContain("cursor-grab");
  });
});
