// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectTaskProposalCard } from "../project-task-proposal-card";
import type { ProjectTaskProposal } from "../project-task-proposal";

afterEach(cleanup);

function proposal(): ProjectTaskProposal {
  return {
    projectId: "project-1",
    tasks: [
      { id: "draft-1", title: "Comprar dominio", priority: 2 },
      { id: "draft-2", title: "Diseñar landing", priority: 3 },
      { id: "draft-3", title: "Publicar v1", priority: 1 },
    ],
  };
}

describe("ProjectTaskProposalCard", () => {
  it("edits, removes, reorders, and confirms the exact final proposal", () => {
    const onConfirm = vi.fn();
    render(
      <ProjectTaskProposalCard
        proposal={proposal()}
        isResolved={false}
        isSending={false}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título tarea 2"), {
      target: { value: "Diseñar landing pública" },
    });
    fireEvent.change(screen.getByLabelText("Prioridad tarea 2"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByLabelText("Quitar Comprar dominio"));
    fireEvent.click(screen.getByLabelText("Mover Publicar v1 arriba"));
    fireEvent.click(screen.getByRole("button", { name: "Crear 2 tareas" }));

    expect(onConfirm).toHaveBeenCalledWith({
      projectId: "project-1",
      tasks: [
        { id: "draft-3", title: "Publicar v1", priority: 1 },
        { id: "draft-2", title: "Diseñar landing pública", priority: 1 },
      ],
    });
    expect(screen.getByText("Propuesta enviada para crear")).toBeTruthy();
  });

  it("keeps confirmation disabled while a title is blank or the chat is streaming", () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ProjectTaskProposalCard
        proposal={proposal()}
        isResolved={false}
        isSending={false}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título tarea 1"), {
      target: { value: "   " },
    });
    expect((screen.getByRole("button", { name: "Crear 3 tareas" }) as HTMLButtonElement).disabled).toBe(true);

    rerender(
      <ProjectTaskProposalCard
        proposal={proposal()}
        isResolved={false}
        isSending
        onConfirm={onConfirm}
      />,
    );
    expect((screen.getByRole("button", { name: "Crear 3 tareas" }) as HTMLButtonElement).disabled).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("dismisses without confirming and renders persisted resolved proposals read-only", () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ProjectTaskProposalCard
        proposal={proposal()}
        isResolved={false}
        isSending={false}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Descartar propuesta" }));
    expect(screen.getByText("Propuesta descartada sin crear tareas")).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    rerender(
      <ProjectTaskProposalCard
        proposal={proposal()}
        isResolved
        isSending={false}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText("Propuesta ya creada")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Crear 3 tareas" })).toBeNull();
  });

  it("allows retry after a confirmed stream finishes without resolving the proposal", () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ProjectTaskProposalCard
        proposal={proposal()}
        isResolved={false}
        isSending={false}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Crear 3 tareas" }));
    rerender(
      <ProjectTaskProposalCard
        proposal={proposal()}
        isResolved={false}
        isSending
        onConfirm={onConfirm}
      />,
    );
    rerender(
      <ProjectTaskProposalCard
        proposal={proposal()}
        isResolved={false}
        isSending={false}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("button", { name: "Crear 3 tareas" })).toBeTruthy();
  });
});
