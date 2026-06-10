interface BreakdownSuggestion {
  title: string;
  steps: string[];
}

interface BreakdownSuggestionsProps {
  suggestions: BreakdownSuggestion[];
  taskId: string;
  isAddingNote: boolean;
  onAddStep: (input: { taskId: string; content: string; type: "breakdown_step" }) => void;
}

export function BreakdownSuggestions({
  suggestions,
  taskId,
  isAddingNote,
  onAddStep,
}: BreakdownSuggestionsProps) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Pasos sugeridos
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.title}
            className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3"
          >
            <div className="text-xs font-medium text-[var(--foreground)]">
              {suggestion.title}
            </div>
            <div className="mt-2 space-y-2">
              {suggestion.steps.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() =>
                    onAddStep({
                      taskId,
                      content: step,
                      type: "breakdown_step",
                    })
                  }
                  disabled={isAddingNote}
                  className="block w-full rounded-xl border border-[var(--glass-border)] bg-white/40 px-3 py-2 text-left text-xs text-[var(--foreground)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {step}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
