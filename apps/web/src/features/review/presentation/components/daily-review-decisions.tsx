interface WatchedCategory {
  id: string;
  name: string;
  watched: boolean;
}

interface DailyReviewDecisionsProps {
  categories: WatchedCategory[];
  note: string;
  summary?: string;
  onToggleCategory?: (categoryId: string) => void;
  onNoteChange?: (value: string) => void;
}

export function DailyReviewDecisions({
  categories,
  note,
  summary,
  onToggleCategory,
  onNoteChange,
}: DailyReviewDecisionsProps) {
  return (
    <section className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Decidir mañana
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Deja una o dos señales accionables para el próximo arranque.
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Categorías para vigilar
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onToggleCategory?.(category.id)}
                disabled={!onToggleCategory}
                className={`rounded-full border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed ${
                  category.watched
                    ? "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--foreground)]"
                    : "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Nota de arranque
          </label>
          <textarea
            value={note}
            onChange={(event) => onNoteChange?.(event.target.value)}
            placeholder="Ej: revisar supermercado antes de gastar de nuevo"
            className="glass-input mt-3 min-h-24 w-full px-4 py-3 text-sm"
          />
        </div>

        {summary ? (
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4 text-sm text-[var(--foreground)]">
            {summary}
          </div>
        ) : null}
      </div>
    </section>
  );
}
