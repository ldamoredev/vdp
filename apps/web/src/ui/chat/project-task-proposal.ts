export type ProjectTaskPriority = 1 | 2 | 3;

export interface ProjectTaskProposalDraft {
  id: string;
  title: string;
  priority: ProjectTaskPriority;
}

export interface ProjectTaskProposal {
  projectId: string;
  tasks: ProjectTaskProposalDraft[];
}

type ProposalMessage = {
  toolName?: string;
  pending?: boolean;
  action?: { tone?: string };
  proposal?: { projectId: string };
  toolInput?: Record<string, unknown>;
};

export function parseProjectTaskProposal(value: unknown): ProjectTaskProposal | null {
  const parsed = parseJson(value);
  if (!isRecord(parsed) || typeof parsed.projectId !== "string" || !Array.isArray(parsed.tasks)) {
    return null;
  }
  if (parsed.projectId.trim() === "" || parsed.tasks.length === 0 || parsed.tasks.length > 8) {
    return null;
  }

  const tasks: ProjectTaskProposalDraft[] = [];
  for (const [index, task] of parsed.tasks.entries()) {
    if (!isRecord(task) || typeof task.title !== "string" || task.title.trim() === "") {
      return null;
    }
    const priority = task.priority ?? 2;
    if (!isProjectTaskPriority(priority)) return null;
    tasks.push({
      id: `draft-${index + 1}`,
      title: task.title.trim(),
      priority,
    });
  }

  return {
    projectId: parsed.projectId,
    tasks,
  };
}

export function updateProjectTaskProposalDraft(
  proposal: ProjectTaskProposal,
  draftId: string,
  patch: Partial<Pick<ProjectTaskProposalDraft, "title" | "priority">>,
): ProjectTaskProposal {
  return {
    ...proposal,
    tasks: proposal.tasks.map((draft) =>
      draft.id === draftId ? { ...draft, ...patch } : draft,
    ),
  };
}

export function removeProjectTaskProposalDraft(
  proposal: ProjectTaskProposal,
  draftId: string,
): ProjectTaskProposal {
  return {
    ...proposal,
    tasks: proposal.tasks.filter((draft) => draft.id !== draftId),
  };
}

export function moveProjectTaskProposalDraft(
  proposal: ProjectTaskProposal,
  draftId: string,
  offset: -1 | 1,
): ProjectTaskProposal {
  const currentIndex = proposal.tasks.findIndex((draft) => draft.id === draftId);
  const targetIndex = currentIndex + offset;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= proposal.tasks.length) {
    return proposal;
  }

  const tasks = [...proposal.tasks];
  const [draft] = tasks.splice(currentIndex, 1);
  tasks.splice(targetIndex, 0, draft);
  return { ...proposal, tasks };
}

export function canConfirmProjectTaskProposal(proposal: ProjectTaskProposal): boolean {
  return proposal.tasks.length > 0 && proposal.tasks.every((draft) => draft.title.trim() !== "");
}

export function buildProjectTaskProposalConfirmation(proposal: ProjectTaskProposal): string {
  const tasks = proposal.tasks.map((draft) => ({
    title: draft.title.trim(),
    priority: draft.priority,
  }));

  return [
    "Confirmo crear exactamente esta propuesta de tareas.",
    `projectId: ${JSON.stringify(proposal.projectId)}`,
    `tasks: ${JSON.stringify(tasks)}`,
    "Usá create_project_tasks una sola vez con este projectId y esta lista exacta. No agregues, elimines, reescribas ni reordenes tareas.",
  ].join("\n");
}

export function isProjectTaskProposalResolved(
  messages: readonly ProposalMessage[],
  proposalIndex: number,
): boolean {
  const projectId = messages[proposalIndex]?.proposal?.projectId;
  if (!projectId) return false;

  return messages
    .slice(proposalIndex + 1)
    .some((message) =>
      message.toolName === "create_project_tasks" &&
      message.pending !== true &&
      message.action?.tone !== "error" &&
      message.toolInput?.projectId === projectId,
    );
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isProjectTaskPriority(value: unknown): value is ProjectTaskPriority {
  return value === 1 || value === 2 || value === 3;
}
