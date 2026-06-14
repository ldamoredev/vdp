import { Plus } from "lucide-react";
import { type FormEvent } from "react";

import { useQuickCapturePresenter } from "./useQuickCapturePresenter";

export function QuickCapture() {
  const presenter = useQuickCapturePresenter();
  const vm = presenter.model;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void presenter.create();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card-static p-6">
      <div className="flex items-center gap-2 text-[var(--foreground)]">
        <Plus size={16} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium">{vm.titleLabel}</h3>
      </div>

      <div className="mt-4">
        <textarea
          value={vm.title}
          onChange={(event) => presenter.setTitle(event.target.value)}
          placeholder={vm.titlePlaceholder}
          rows={4}
          className="glass-input min-h-28 w-full resize-none px-4 py-3 text-sm leading-relaxed"
          disabled={vm.isCreating}
        />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            {vm.priorityLabel}
          </div>
          <div className="flex gap-2">
            {vm.priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => presenter.setPriority(option.value)}
                aria-pressed={option.selected}
                className={`rounded-2xl border px-3 py-2 text-xs font-medium transition-all ${option.className}`}
                disabled={vm.isCreating}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            {vm.domainLabel}
          </div>
          <select
            value={vm.domain}
            onChange={(event) => presenter.setDomain(event.target.value)}
            className="glass-input w-full px-3 py-2 text-sm"
            disabled={vm.isCreating}
          >
            {vm.domainOptions.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" disabled={!vm.canCreate} className="btn-primary mt-5 w-full justify-center">
        <Plus size={16} />
        {vm.submitLabel}
      </button>

      {vm.errorMessage && (
        <p className="mt-3 text-xs leading-relaxed text-[var(--red-soft-text)]">{vm.errorMessage}</p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{vm.helperText}</p>
    </form>
  );
}
