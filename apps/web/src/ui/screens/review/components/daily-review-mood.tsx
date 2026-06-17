import type { ReviewViewModel } from "@/ui/models/review/ReviewViewModel";

interface DailyReviewMoodProps {
  mood: ReviewViewModel["mood"];
  onSave: (mood: number, energy: number) => void;
}

export function DailyReviewMood({ mood, onSave }: DailyReviewMoodProps) {
  return (
    <section className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Ánimo y energía
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {mood.summary}
        </p>
      </div>

      <div className="space-y-4 p-5">
        <ScoreRow
          label="Ánimo"
          options={mood.moodOptions}
          disabled={mood.isSaving}
          onSelect={(value) => onSave(value, mood.selectedEnergy ?? value)}
        />
        <ScoreRow
          label="Energía"
          options={mood.energyOptions}
          disabled={mood.isSaving}
          onSelect={(value) => onSave(mood.selectedMood ?? value, value)}
        />
        {mood.error ? (
          <div className="rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] p-4 text-sm text-[var(--red-soft-text)]">
            {mood.error}
          </div>
        ) : null}
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4 text-sm text-[var(--foreground)]">
          {mood.weeklyInsight}
        </div>
      </div>
    </section>
  );
}

function ScoreRow({
  label,
  options,
  disabled = false,
  onSelect,
}: {
  label: string;
  options: ReviewViewModel["mood"]["moodOptions"];
  disabled?: boolean;
  onSelect: (value: number) => void;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-3 grid grid-cols-5 justify-items-center gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.value)}
            className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition-colors hover:border-[var(--glass-border-hover)] disabled:cursor-not-allowed disabled:opacity-60 ${
              option.selected
                ? "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--foreground)]"
                : "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)]"
            }`}
            aria-pressed={option.selected}
          >
            <span className="font-data">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
