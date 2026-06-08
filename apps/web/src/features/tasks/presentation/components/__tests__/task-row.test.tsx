// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { Task } from "@/lib/api/types";
import { TaskRow } from "../task-row";

/**
 * Critical-flow smoke test for the task row actions (complete / carry-over /
 * discard / detail / delete). This is a starting point for component-level
 * coverage with @testing-library/react, not exhaustive coverage. jsdom does not
 * apply Tailwind, so the responsive desktop+mobile markup both render; the
 * action buttons live only in the desktop block, while the complete checkbox is
 * duplicated — hence `getAllByLabelText(...)[0]`.
 */
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Comprar pan",
    description: null,
    priority: 2,
    status: "pending",
    scheduledDate: "2026-06-08",
    domain: "work",
    carryOverCount: 0,
    completedAt: null,
    createdAt: "2026-06-08T08:00:00.000Z",
    updatedAt: "2026-06-08T08:00:00.000Z",
    ...overrides,
  };
}

function setup(task: Task = makeTask()) {
  const handlers = {
    onComplete: vi.fn(),
    onCarryOver: vi.fn(),
    onDiscard: vi.fn(),
    onDelete: vi.fn(),
    onOpenDetail: vi.fn(),
    onToggleActions: vi.fn(),
  };
  render(<TaskRow task={task} busy={false} actionsOpen={false} {...handlers} />);
  return handlers;
}

afterEach(cleanup);

describe("TaskRow", () => {
  it("completes a pending task from the checkbox", () => {
    const handlers = setup();

    fireEvent.click(screen.getAllByLabelText('Marcar "Comprar pan" como hecha')[0]);

    expect(handlers.onComplete).toHaveBeenCalledWith("task-1");
  });

  it("triggers carry-over, discard, and detail from the row actions", () => {
    const handlers = setup();

    fireEvent.click(screen.getByTitle("Llevar a manana"));
    expect(handlers.onCarryOver).toHaveBeenCalledWith("task-1");

    fireEvent.click(screen.getByTitle("Descartar"));
    expect(handlers.onDiscard).toHaveBeenCalledWith("task-1");

    fireEvent.click(screen.getByTitle("Ver detalle"));
    expect(handlers.onOpenDetail).toHaveBeenCalledWith("task-1");
  });

  it("disables completion for a done task and exposes delete instead", () => {
    const handlers = setup(makeTask({ status: "done", completedAt: "2026-06-08T10:00:00.000Z" }));

    const checkbox = screen.getAllByLabelText('"Comprar pan" ya esta hecha')[0] as HTMLButtonElement;
    expect(checkbox.disabled).toBe(true);

    fireEvent.click(screen.getByTitle("Borrar"));
    expect(handlers.onDelete).toHaveBeenCalledWith("task-1");
  });

  it("disables row actions while a mutation is in flight", () => {
    const handlers = { onComplete: vi.fn(), onCarryOver: vi.fn(), onDiscard: vi.fn(), onDelete: vi.fn(), onOpenDetail: vi.fn(), onToggleActions: vi.fn() };
    render(<TaskRow task={makeTask()} busy actionsOpen={false} {...handlers} />);

    const carryOver = screen.getByTitle("Llevar a manana") as HTMLButtonElement;
    expect(carryOver.disabled).toBe(true);

    fireEvent.click(carryOver);
    expect(handlers.onCarryOver).not.toHaveBeenCalled();
  });
});
