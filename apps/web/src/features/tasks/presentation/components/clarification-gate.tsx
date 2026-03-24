import { Check, Sparkles } from "lucide-react";
import { useTasksData, useTasksActions } from "../use-tasks-context";

export function ClarificationGate() {
  const {
    draftClarification,
    clarificationOutcome,
    clarificationNextStep,
    showClarificationGate,
  } = useTasksData();
  const {
    setClarificationOutcome,
    setClarificationNextStep,
    setShowClarificationGate,
    setNewTitle,
    submitTask,
  } = useTasksActions();

  if (!showClarificationGate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-[var(--amber-soft-border)] bg-[var(--sidebar)] p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-[var(--foreground)]">
          <Sparkles size={15} style={{ color: "var(--amber-soft-text)" }} />
          <h4 className="text-sm font-medium">Aclara la tarea antes de cargarla</h4>
        </div>

        <div className="mt-3 space-y-2">
          {draftClarification.reasons.map((reason) => (
            <p key={reason} className="text-xs leading-relaxed text-[var(--muted)]">
              {reason}
            </p>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Resultado esperado
            </label>
            <input
              value={clarificationOutcome}
              onChange={(e) => setClarificationOutcome(e.target.value)}
              placeholder="Que tiene que quedar resuelto?"
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Siguiente paso concreto
            </label>
            <input
              value={clarificationNextStep}
              onChange={(e) => setClarificationNextStep(e.target.value)}
              placeholder="Cual es la siguiente accion visible?"
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Ejemplos
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {draftClarification.examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setNewTitle(example);
                  setShowClarificationGate(false);
                }}
                className="block w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-3 text-left text-xs text-[var(--foreground)] transition-all hover:translate-y-[-1px]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => submitTask(true)}
            disabled={
              !clarificationOutcome.trim() && !clarificationNextStep.trim()
            }
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={14} />
            Guardar clarificada
          </button>
          <button
            type="button"
            onClick={() => setShowClarificationGate(false)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px]"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={() => submitTask(true, false)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px]"
          >
            Crear igual
          </button>
        </div>
      </div>
    </div>
  );
}
