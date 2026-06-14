import { Check, Sparkles } from "lucide-react";

import type { ClarificationGateVM } from "@/ui/models/tasks/QuickCaptureViewModel";

export interface ClarificationGateActions {
  onOutcomeChange: (value: string) => void;
  onNextStepChange: (value: string) => void;
  onUseExample: (example: string) => void;
  onSaveClarified: () => void;
  onKeepEditing: () => void;
  onCreateAnyway: () => void;
}

export function ClarificationGate({
  gate,
  actions,
}: {
  gate: ClarificationGateVM;
  actions: ClarificationGateActions;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-[var(--amber-soft-border)] bg-[var(--sidebar)] p-6 shadow-2xl">
        <div className="flex items-center gap-2 text-[var(--foreground)]">
          <Sparkles size={15} style={{ color: "var(--amber-soft-text)" }} />
          <h4 className="text-sm font-medium">{gate.heading}</h4>
        </div>

        <div className="mt-3 space-y-2">
          {gate.reasons.map((reason) => (
            <p key={reason} className="text-xs leading-relaxed text-[var(--muted)]">
              {reason}
            </p>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              {gate.outcomeLabel}
            </label>
            <input
              value={gate.outcome}
              onChange={(event) => actions.onOutcomeChange(event.target.value)}
              placeholder={gate.outcomePlaceholder}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              {gate.nextStepLabel}
            </label>
            <input
              value={gate.nextStep}
              onChange={(event) => actions.onNextStepChange(event.target.value)}
              placeholder={gate.nextStepPlaceholder}
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Ejemplos</div>
          <div className="grid gap-2 md:grid-cols-3">
            {gate.examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => actions.onUseExample(example)}
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
            onClick={actions.onSaveClarified}
            disabled={!gate.canSaveClarified}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={14} />
            {gate.saveLabel}
          </button>
          <button
            type="button"
            onClick={actions.onKeepEditing}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px]"
          >
            {gate.keepEditingLabel}
          </button>
          <button
            type="button"
            onClick={actions.onCreateAnyway}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--amber-soft-text)] transition-all hover:translate-y-[-1px]"
          >
            {gate.createAnywayLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
