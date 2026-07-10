import { describe, expect, it } from "vitest";

import {
  buildProjectTaskProposalConfirmation,
  buildProposalMessageKeys,
  canConfirmProjectTaskProposal,
  isProjectTaskProposalResolved,
  moveProjectTaskProposalDraft,
  parseProjectTaskProposal,
  removeProjectTaskProposalDraft,
  updateProjectTaskProposalDraft,
} from "../project-task-proposal";

const rawProposal = {
  projectId: "project-1",
  tasks: [
    { title: "Comprar dominio", priority: 2 },
    { title: "Diseñar landing", priority: 3 },
    { title: "Publicar v1", priority: 1 },
  ],
};

describe("project task proposal", () => {
  it("parses the same structured proposal from stream objects and persisted JSON", () => {
    const fromStream = parseProjectTaskProposal(rawProposal);
    const fromHistory = parseProjectTaskProposal(JSON.stringify(rawProposal));

    expect(fromStream).toEqual(fromHistory);
    expect(fromStream).toEqual({
      projectId: "project-1",
      tasks: [
        { id: "draft-1", title: "Comprar dominio", priority: 2 },
        { id: "draft-2", title: "Diseñar landing", priority: 3 },
        { id: "draft-3", title: "Publicar v1", priority: 1 },
      ],
    });
  });

  it("rejects malformed proposals instead of parsing assistant prose", () => {
    expect(parseProjectTaskProposal("Comprar dominio\nDiseñar landing")).toBeNull();
    expect(parseProjectTaskProposal({ projectId: "project-1", tasks: [] })).toBeNull();
    expect(parseProjectTaskProposal({
      projectId: "project-1",
      tasks: [{ title: "Tarea", priority: 9 }],
    })).toBeNull();
  });

  it("edits title and priority without mutating the original proposal", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    const updated = updateProjectTaskProposalDraft(proposal, "draft-2", {
      title: "Diseñar landing pública",
      priority: 1,
    });

    expect(updated.tasks[1]).toMatchObject({
      title: "Diseñar landing pública",
      priority: 1,
    });
    expect(proposal.tasks[1]).toMatchObject({ title: "Diseñar landing", priority: 3 });
  });

  it("removes and reorders individual drafts", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    const withoutSecond = removeProjectTaskProposalDraft(proposal, "draft-2");
    const moved = moveProjectTaskProposalDraft(withoutSecond, "draft-3", -1);

    expect(moved.tasks.map((task) => task.title)).toEqual([
      "Publicar v1",
      "Comprar dominio",
    ]);
  });

  it("disables confirmation for an empty or blank final list", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    const blank = updateProjectTaskProposalDraft(proposal, "draft-1", { title: "   " });
    const empty = {
      ...proposal,
      tasks: [],
    };

    expect(canConfirmProjectTaskProposal(proposal)).toBe(true);
    expect(canConfirmProjectTaskProposal(blank)).toBe(false);
    expect(canConfirmProjectTaskProposal(empty)).toBe(false);
  });

  it("builds a deterministic confirmation with the exact final order and drafts", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    const edited = moveProjectTaskProposalDraft(
      removeProjectTaskProposalDraft(
        updateProjectTaskProposalDraft(proposal, "draft-2", {
          title: "Diseñar landing pública",
          priority: 1,
        }),
        "draft-1",
      ),
      "draft-3",
      -1,
    );

    expect(buildProjectTaskProposalConfirmation(edited)).toBe([
      "Confirmo crear exactamente esta propuesta de tareas.",
      'projectId: "project-1"',
      'tasks: [{"title":"Publicar v1","priority":1},{"title":"Diseñar landing pública","priority":1}]',
      "Usá create_project_tasks una sola vez con este projectId y esta lista exacta. No agregues, elimines, reescribas ni reordenes tareas.",
    ].join("\n"));
  });

  it("marks a persisted proposal resolved when a creation result follows it", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    const messages = [
      { toolName: "propose_project_tasks", proposal },
      { toolName: "create_project_tasks", toolInput: { projectId: "project-1" } },
      { toolName: "propose_project_tasks", proposal },
    ];

    expect(isProjectTaskProposalResolved(messages, 0)).toBe(true);
    expect(isProjectTaskProposalResolved(messages, 2)).toBe(false);
  });

  it("does not resolve a proposal for a pending or failed creation", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    expect(isProjectTaskProposalResolved([
      { toolName: "propose_project_tasks", proposal },
      { toolName: "create_project_tasks", pending: true, toolInput: { projectId: "project-1" } },
    ], 0)).toBe(false);
    expect(isProjectTaskProposalResolved([
      { toolName: "propose_project_tasks", proposal },
      { toolName: "create_project_tasks", pending: false, action: { tone: "error" }, toolInput: { projectId: "project-1" } },
    ], 0)).toBe(false);
  });

  it("does not resolve a proposal when a later batch belongs to another project", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    const messages = [
      { toolName: "propose_project_tasks", proposal },
      { toolName: "create_project_tasks", toolInput: { projectId: "project-2" } },
    ];

    expect(isProjectTaskProposalResolved(messages, 0)).toBe(false);
  });

  it("keeps the same key for a proposal across stream and persisted message ids", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    const streamed = [
      { id: "1720000000000", proposal: undefined },
      { id: "1720000000001", proposal: undefined },
      { id: "tool-1720000000002", proposal },
    ];
    const persisted = [
      { id: "user-record-1", proposal: undefined },
      { id: "assistant-record-1", proposal: undefined },
      { id: "tool-record-1", proposal },
    ];

    const streamedKeys = buildProposalMessageKeys(streamed, "conversation-1");
    const persistedKeys = buildProposalMessageKeys(persisted, "conversation-1");

    expect(streamedKeys[2]).toBe(persistedKeys[2]);
    expect(streamedKeys[0]).toBe("1720000000000");
    expect(persistedKeys[0]).toBe("user-record-1");
  });

  it("scopes proposal keys by conversation and ordinal", () => {
    const proposal = parseProjectTaskProposal(rawProposal)!;
    const messages = [
      { id: "a", proposal },
      { id: "b", proposal: undefined },
      { id: "c", proposal },
    ];

    const keys = buildProposalMessageKeys(messages, "conversation-1");
    const otherConversation = buildProposalMessageKeys(messages, "conversation-2");
    const newConversation = buildProposalMessageKeys(messages, undefined);

    expect(keys[0]).not.toBe(keys[2]);
    expect(keys[0]).not.toBe(otherConversation[0]);
    expect(newConversation[0]).not.toBe(keys[0]);
    expect(keys[1]).toBe("b");
  });
});
