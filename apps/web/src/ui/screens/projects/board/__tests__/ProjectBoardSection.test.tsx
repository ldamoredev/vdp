// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectBoardViewModel } from "@/ui/models/projects/ProjectBoardViewModel";

const longTitle =
  "Realizar un escaneo inicial de vulnerabilidades con herramientas automatizadas y revisar cada hallazgo";

const model: ProjectBoardViewModel = {
  projectId: "p1",
  title: "Vulnerabilidades temaiken",
  subtitle: "Próximo: resolver las vulnerabilidades",
  breakdownAction: {
    label: "Desglosar en tareas (IA)",
    isDisabled: false,
  },
  reviewAction: {
    label: "Revisar proyecto (IA)",
    isDisabled: false,
  },
  isLoading: false,
  error: null,
  columns: [
    {
      id: "backlog",
      title: "Backlog",
      count: 1,
      emptyText: "Sin tareas",
      tasks: [
        {
          id: "t1",
          title: longTitle,
          priorityLabel: "P3",
          statusLabel: "Pendiente",
          isBusy: false,
        },
      ],
    },
    { id: "next", title: "Próximo", count: 0, emptyText: "Nada marcado como siguiente acción.", tasks: [] },
    { id: "doing", title: "En foco", count: 0, emptyText: "Nada en foco ahora.", tasks: [] },
    { id: "done", title: "Hecho", count: 0, emptyText: "Nada terminado.", tasks: [] },
  ],
};

const presenter = {
  model,
  moveTask: vi.fn().mockResolvedValue(undefined),
  startProjectReviewChat: vi.fn(),
  startBreakdownChat: vi.fn(),
};

vi.mock("../useProjectBoardPresenter", () => ({
  useProjectBoardPresenter: () => presenter,
}));

import { ProjectBoardSection } from "../ProjectBoardSection";

describe("ProjectBoardSection", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adapts columns to the available width and keeps the header stacked", () => {
    render(<ProjectBoardSection projectId="p1" />);

    const board = screen.getByLabelText("Columnas del board");
    expect(board.className).toContain("grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]");
    expect(board.className).not.toContain("xl:grid-cols-4");

    const header = screen.getByText("Board del proyecto").closest("header");
    expect(header?.className).not.toContain("sm:flex-row");
  });

  it("moves a task from one compact selector and visually limits long titles", () => {
    render(<ProjectBoardSection projectId="p1" />);

    const selector = screen.getByRole("combobox", { name: `Mover ${longTitle}` });
    expect(screen.getAllByRole("combobox")).toHaveLength(1);

    fireEvent.change(selector, { target: { value: "doing" } });

    expect(presenter.moveTask).toHaveBeenCalledWith("t1", "doing");
    const title = screen.getByText(longTitle);
    expect(title.className).toContain("line-clamp-4");
    expect(title.getAttribute("title")).toBe(longTitle);
  });
});
