import { Archive, Plus, Users } from "lucide-react";

import { useClientManagerPresenter } from "./useClientManagerPresenter";

export function ClientManagerSection({ onClientsChanged }: { onClientsChanged?: () => void }) {
  const presenter = useClientManagerPresenter(onClientsChanged);
  const vm = presenter.model;

  return (
    <section className="glass-card-static overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--divider)] p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Users size={15} />
          Clientes
        </h2>
        <button
          type="button"
          onClick={() => presenter.toggleOpen()}
          className="text-xs font-medium text-[var(--accent)]"
        >
          {vm.isOpen ? "Cerrar" : "Administrar"}
        </button>
      </header>
      {vm.isOpen && (
        <div className="space-y-3 p-3">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void presenter.createClient();
            }}
          >
            <input
              value={vm.newName}
              onChange={(event) => presenter.setNewName(event.target.value)}
              placeholder="Nuevo cliente"
              className="min-h-10 flex-1 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
            />
            <button type="submit" disabled={!vm.canSubmit} className="btn-primary">
              <Plus size={16} />
            </button>
          </form>
          {vm.error && <p className="text-xs text-[var(--danger)]">{vm.error}</p>}
          {vm.clients.length === 0 ? (
            <p className="px-1 text-xs text-[var(--muted)]">Todavía no hay clientes.</p>
          ) : (
            <ul className="space-y-1">
              {vm.clients.map((client) => (
                <li
                  key={client.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--divider)] bg-[var(--card)] px-3 py-2"
                >
                  <input
                    value={client.draftName}
                    disabled={!client.isActive || client.isBusy}
                    onChange={(event) => presenter.setDraftName(client.id, event.target.value)}
                    onBlur={() => void presenter.renameClient(client.id)}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none disabled:text-[var(--muted)]"
                  />
                  {client.isActive ? (
                    <button
                      type="button"
                      disabled={client.isBusy}
                      onClick={() => void presenter.archiveClient(client.id)}
                      title="Archivar cliente"
                      className="text-[var(--muted)] transition hover:text-[var(--danger)] disabled:opacity-50"
                    >
                      <Archive size={14} />
                    </button>
                  ) : (
                    <span className="font-data text-[10px] uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
                      {client.statusLabel}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
