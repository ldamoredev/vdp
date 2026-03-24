import type { TaskNote } from "@/lib/api/types";

interface PersistedStepsProps {
  steps: TaskNote[];
}

export function PersistedSteps({ steps }: PersistedStepsProps) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Pasos persistidos
      </div>
      {steps.length > 0 ? (
        <div className="space-y-2">
          {steps.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-3 py-3 text-sm text-[var(--foreground)]"
            >
              <div className="mb-2 inline-flex rounded-full border border-[var(--violet-soft-border)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--violet-soft-text)]">
                Paso
              </div>
              <div>{note.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-6 text-center text-xs text-[var(--muted)]">
          Todavia no hay pasos guardados para esta tarea.
        </div>
      )}
    </div>
  );
}
