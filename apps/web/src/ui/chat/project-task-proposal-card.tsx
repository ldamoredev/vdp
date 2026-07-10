import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Sparkles, Trash2, X } from "lucide-react";

import {
  canConfirmProjectTaskProposal,
  moveProjectTaskProposalDraft,
  removeProjectTaskProposalDraft,
  updateProjectTaskProposalDraft,
  type ProjectTaskPriority,
  type ProjectTaskProposal,
} from "./project-task-proposal";

interface ProjectTaskProposalCardProps {
  proposal: ProjectTaskProposal;
  isResolved: boolean;
  isSending: boolean;
  onConfirm: (proposal: ProjectTaskProposal) => void;
}

export function ProjectTaskProposalCard({
  proposal,
  isResolved,
  isSending,
  onConfirm,
}: ProjectTaskProposalCardProps) {
  const [draftProposal, setDraftProposal] = useState(proposal);
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sawSubmittedStream = useRef(false);

  useEffect(() => {
    if (submitted && isSending) {
      sawSubmittedStream.current = true;
    }
    if (submitted && sawSubmittedStream.current && !isSending && !isResolved) {
      sawSubmittedStream.current = false;
      setSubmitted(false);
    }
  }, [isResolved, isSending, submitted]);

  if (isResolved) {
    return <ProposalStatus text="Propuesta ya creada" />;
  }
  if (submitted) {
    return <ProposalStatus text="Propuesta enviada para crear" />;
  }
  if (dismissed) {
    return <ProposalStatus text="Propuesta descartada sin crear tareas" />;
  }

  const canConfirm = canConfirmProjectTaskProposal(draftProposal) && !isSending;

  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--card)] p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <Sparkles size={15} className="text-[var(--accent)]" />
            Revisá las tareas propuestas
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            Ajustá el lote antes de enviarlo al backlog.
          </p>
        </div>
        <button
          type="button"
          aria-label="Descartar propuesta"
          onClick={() => setDismissed(true)}
          className="rounded-full p-1.5 text-[var(--muted)] transition hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {draftProposal.tasks.map((draft, index) => (
          <div
            key={draft.id}
            className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-2.5"
          >
            <div className="flex items-start gap-2">
              <span className="font-data mt-2 text-[11px] text-[var(--muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <label className="block">
                  <span className="sr-only">Título tarea {index + 1}</span>
                  <input
                    aria-label={`Título tarea ${index + 1}`}
                    value={draft.title}
                    onChange={(event) =>
                      setDraftProposal((current) =>
                        updateProjectTaskProposalDraft(current, draft.id, {
                          title: event.target.value,
                        }),
                      )
                    }
                    className="glass-input w-full px-3 py-2 text-xs"
                  />
                </label>
                <div className="flex items-center gap-1.5">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Prioridad tarea {index + 1}</span>
                    <select
                      aria-label={`Prioridad tarea ${index + 1}`}
                      value={draft.priority}
                      onChange={(event) =>
                        setDraftProposal((current) =>
                          updateProjectTaskProposalDraft(current, draft.id, {
                            priority: Number(event.target.value) as ProjectTaskPriority,
                          }),
                        )
                      }
                      className="glass-input w-full px-2.5 py-1.5 text-xs"
                    >
                      <option value={1}>Baja</option>
                      <option value={2}>Media</option>
                      <option value={3}>Alta</option>
                    </select>
                  </label>
                  <IconButton
                    label={`Mover ${draft.title} arriba`}
                    disabled={index === 0}
                    onClick={() =>
                      setDraftProposal((current) =>
                        moveProjectTaskProposalDraft(current, draft.id, -1),
                      )
                    }
                  >
                    <ArrowUp size={13} />
                  </IconButton>
                  <IconButton
                    label={`Mover ${draft.title} abajo`}
                    disabled={index === draftProposal.tasks.length - 1}
                    onClick={() =>
                      setDraftProposal((current) =>
                        moveProjectTaskProposalDraft(current, draft.id, 1),
                      )
                    }
                  >
                    <ArrowDown size={13} />
                  </IconButton>
                  <IconButton
                    label={`Quitar ${draft.title}`}
                    onClick={() =>
                      setDraftProposal((current) =>
                        removeProjectTaskProposalDraft(current, draft.id),
                      )
                    }
                  >
                    <Trash2 size={13} />
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!canConfirm}
        onClick={() => {
          setSubmitted(true);
          onConfirm(draftProposal);
        }}
        className="btn-primary mt-3 w-full justify-center text-xs disabled:opacity-40"
      >
        Crear {draftProposal.tasks.length} tarea{draftProposal.tasks.length === 1 ? "" : "s"}
      </button>
    </div>
  );
}

function ProposalStatus({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-3 text-xs text-[var(--muted)]">
      {text}
    </div>
  );
}

function IconButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-[var(--divider)] p-1.5 text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:opacity-30"
    >
      {children}
    </button>
  );
}
