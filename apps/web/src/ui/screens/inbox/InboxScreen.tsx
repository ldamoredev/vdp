import { Inbox, Trash2 } from "lucide-react";

import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import { useInboxPresenter } from "./useInboxPresenter";

export function InboxScreen() {
  const presenter = useInboxPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="3xl" spacing="6" className="domain-inbox">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
          Captura sin fricción
        </p>
        <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">Bandeja</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Anotá cualquier cosa ahora y decidí después a qué módulo va.
        </p>
      </header>

      <form
        className="glass-card-static space-y-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.capture();
        }}
      >
        <textarea
          value={vm.draft}
          onChange={(event) => presenter.setDraft(event.target.value)}
          rows={3}
          placeholder="Una idea, un gasto, un síntoma, una tarea…"
          className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
        />
        <div className="flex justify-end">
          <button type="submit" disabled={!vm.canSubmit} className="btn-primary">
            Capturar
          </button>
        </div>
      </form>

      {vm.error ? (
        <StateCard state="error" title="No pudimos cargar la bandeja" description={vm.error} />
      ) : vm.isLoading && vm.items.length === 0 ? (
        <StateCard state="loading" skeletonLines={3} />
      ) : vm.items.length === 0 ? (
        <StateCard
          title="Bandeja vacía"
          description="Lo que captures aparece acá hasta que lo tries a un módulo."
        />
      ) : (
        <section className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
            Pendientes <span className="font-data">{vm.pendingCount}</span>
          </p>
          <ul className="space-y-2">
            {vm.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap break-words text-sm text-[var(--foreground)]">{item.text}</p>
                  <p className="mt-1 font-data text-[11px] text-[var(--muted)]">{item.capturedLabel}</p>
                </div>
                <button
                  type="button"
                  aria-label="Descartar"
                  onClick={() => void presenter.discard(item.id)}
                  className="btn-secondary min-h-9 text-xs"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Inbox size={14} />
        <span>El triage hacia cada módulo llega en D5b.</span>
      </div>
    </ModulePage>
  );
}
