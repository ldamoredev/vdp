import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { TaskRowVM } from "@/ui/models/tasks/ExecutionQueueViewModel";
import { TaskRow, type TaskRowActions } from "../TaskRow";

const actions: TaskRowActions = {
  onComplete: vi.fn(),
  onCarryOver: vi.fn(),
  onDiscard: vi.fn(),
  onDelete: vi.fn(),
  onOpenDetail: vi.fn(),
  onToggleActions: vi.fn(),
};

function row(overrides: Partial<TaskRowVM> = {}): TaskRowVM {
  return {
    id: "t1",
    title: "Resolver bloqueo",
    done: false,
    isStuck: false,
    toneClass: "border-[var(--glass-border)] bg-[var(--hover-overlay)]",
    priority: 1,
    domain: "tasks",
    carryOverCount: 0,
    busy: false,
    actionsOpen: false,
    ...overrides,
  };
}

describe("TaskRow", () => {
  it("renders stuck rows with a semantic 3px rail and soft red surface", () => {
    const markup = renderToStaticMarkup(
      createElement(TaskRow, {
        task: row({
          isStuck: true,
          toneClass: "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]",
          carryOverCount: 3,
        }),
        actions,
      }),
    );

    expect(markup).toContain("bg-[var(--stuck-rail)]");
    expect(markup).toContain("w-[3px]");
    expect(markup).toContain("border-[var(--red-soft-border)]");
    expect(markup).toContain("bg-[var(--red-soft-bg)]");
  });

  it("keeps mobile controls at least 44px while the completion checkbox stays visible", () => {
    const markup = renderToStaticMarkup(
      createElement(TaskRow, {
        task: row({ actionsOpen: true }),
        actions,
      }),
    );

    expect(markup).toContain("h-11 w-11");
    expect(markup).toContain('aria-label="Marcar &quot;Resolver bloqueo&quot; como hecha"');
    expect(markup).toContain("min-h-11");
  });
});
