import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { ListChecks, Plus } from "lucide-react";

import { priorityLabel } from "@/lib/format";
import type {
  BoardColumnVM,
  BoardComposerVM,
  BoardScope,
  BoardTaskActions,
  BoardViewModel,
} from "@/ui/models/tasks/BoardViewModel";
import { StateCard } from "@/ui/primitives/state-card";
import type { BoardPresenter } from "./BoardPresenter";
import { BoardColumn } from "./board-column";
import { TaskCard } from "./task-card";
import { useBoardPresenter } from "./useBoardPresenter";

const PRIORITIES = [3, 2, 1];

/**
 * The per-module task board section, mounted inside a module screen. Humble
 * view: it reads the ViewModel and forwards drag/quick-action/create events to
 * the presenter, which owns the column → status mapping.
 */
export function BoardSection({ domain }: { domain: string }) {
  const presenter = useBoardPresenter(domain);
  const vm = presenter.model;
  const navigate = useNavigate();

  const actions: BoardTaskActions = {
    onStart: (id) => void presenter.startTask(id),
    onComplete: (id) => void presenter.complete(id),
    onCarryOver: (id) => void presenter.carryOver(id),
    onDiscard: (id) => void presenter.discard(id),
    onOpenDetail: () => navigate("/tasks"),
  };

  return (
    <section aria-label={`Tareas de ${vm.domainLabel}`} className="glass-card-static overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-[var(--divider)] p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--accent-glow)] text-[var(--accent)]">
            <ListChecks size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[var(--tracking-eyebrow)] text-[var(--muted)]">
              Tablero
            </p>
            <h2 className="font-display text-xl font-bold leading-tight text-[var(--foreground)]">
              Tareas de {vm.domainLabel}
            </h2>
          </div>
        </div>
        <ScopeToggle scope={vm.scope} onChange={(scope) => presenter.setScope(scope)} />
      </header>

      <div className="p-5 md:p-6">
        <BoardBody vm={vm} presenter={presenter} actions={actions} />
      </div>
    </section>
  );
}

function BoardBody({
  vm,
  presenter,
  actions,
}: {
  vm: BoardViewModel;
  presenter: BoardPresenter;
  actions: BoardTaskActions;
}) {
  if (vm.error) {
    return (
      <StateCard
        state="error"
        size="sm"
        title="No pudimos cargar el tablero"
        description="Reintentá en un momento."
      />
    );
  }

  if (vm.isLoading && vm.columns.every((column) => column.tasks.length === 0)) {
    return <BoardSkeleton columns={vm.columns.length} />;
  }

  return (
    <>
      {/* Desktop kanban with drag-drop. */}
      <div
        className={`hidden gap-3 md:grid ${desktopGridClass(vm.columns.length)}`}
      >
        {vm.columns.map((column) => (
          <Column key={column.id} column={column} vm={vm} presenter={presenter} actions={actions} />
        ))}
      </div>

      {/* Mobile: status switcher + single column, one-tap actions, no drag. */}
      <MobileBoard vm={vm} presenter={presenter} actions={actions} />
    </>
  );
}

function MobileBoard({
  vm,
  presenter,
  actions,
}: {
  vm: BoardViewModel;
  presenter: BoardPresenter;
  actions: BoardTaskActions;
}) {
  const selected = vm.columns.find((column) => column.id === vm.mobileColumnId) ?? vm.columns[0];
  const showComposer = selected.id === "pending" && vm.composer !== null;

  return (
    <div className="md:hidden">
      <div role="tablist" aria-label="Estado" className="flex items-center gap-1.5">
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {vm.columns.map((column) => (
            <button
              key={column.id}
              type="button"
              role="tab"
              aria-selected={column.id === vm.mobileColumnId}
              onClick={() => presenter.setMobileColumn(column.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-xs font-medium transition-all ${
                column.id === vm.mobileColumnId
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : "bg-[var(--hover-overlay)] text-[var(--muted)]"
              }`}
            >
              {column.title}
              <span className="font-data text-[11px] font-semibold opacity-80">{column.count}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Crear tarea"
          onClick={() => {
            presenter.setMobileColumn("pending");
            presenter.openComposer();
          }}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--card)] text-[var(--accent)] transition-all"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {showComposer && vm.composer && <Composer composer={vm.composer} presenter={presenter} />}
        {selected.tasks.length === 0 && !showComposer ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--divider)] px-3 py-8 text-center text-xs leading-relaxed text-[var(--muted)]">
            {selected.emptyText}
          </div>
        ) : (
          selected.tasks.map((task) => <TaskCard key={task.id} task={task} actions={actions} />)
        )}
      </div>
    </div>
  );
}

function Column({
  column,
  vm,
  presenter,
  actions,
}: {
  column: BoardColumnVM;
  vm: BoardViewModel;
  presenter: BoardPresenter;
  actions: BoardTaskActions;
}) {
  const cards: ReactNode[] = [];
  if (column.id === "pending" && vm.composer) {
    cards.push(<Composer key="composer" composer={vm.composer} presenter={presenter} />);
  }
  for (const task of column.tasks) {
    cards.push(
      <TaskCard
        key={task.id}
        task={task}
        actions={actions}
        draggable
        dragging={task.id === vm.draggingId}
        onDragStart={() => presenter.startDrag(task.id)}
        onDragEnd={() => presenter.endDrag()}
      />,
    );
  }

  return (
    <BoardColumn
      title={column.title}
      count={column.count}
      tone={column.tone}
      empty={column.emptyText}
      isDropTarget={column.isDropTarget}
      onAdd={column.canCreate ? () => presenter.openComposer() : undefined}
      onDragOver={(event) => {
        event.preventDefault();
        presenter.setDropTarget(column.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        presenter.drop(column.id);
      }}
    >
      {cards}
    </BoardColumn>
  );
}

function ScopeToggle({ scope, onChange }: { scope: BoardScope; onChange: (scope: BoardScope) => void }) {
  const options: { key: BoardScope; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "active", label: "Activas" },
  ];
  return (
    <div className="inline-flex rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-0.5">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          aria-pressed={scope === option.key}
          className={`rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium transition-all ${
            scope === option.key
              ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Composer({ composer, presenter }: { composer: BoardComposerVM; presenter: BoardPresenter }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void presenter.submitComposer();
      }}
      className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--card)] p-3"
    >
      <input
        value={composer.title}
        onChange={(event) => presenter.setComposerTitle(event.target.value)}
        placeholder="Nueva tarea…"
        aria-label="Título de la tarea"
        autoFocus
        className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
      />
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="inline-flex gap-1">
          {PRIORITIES.map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => presenter.setComposerPriority(priority)}
              aria-pressed={composer.priority === priority}
              className={`rounded-[var(--radius-sm)] px-2 py-1 text-[10px] font-medium transition-all ${
                composer.priority === priority
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {priorityLabel(priority)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => presenter.closeComposer()}
            className="rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium text-[var(--muted)] transition-all hover:text-[var(--foreground)]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!composer.canSubmit}
            className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 py-1 text-xs font-medium text-[var(--accent-contrast)] transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>
    </form>
  );
}

function BoardSkeleton({ columns }: { columns: number }) {
  const gridClass = desktopGridClass(columns);
  return (
    <div className={`grid gap-3 ${gridClass}`} role="status" aria-busy="true" aria-label="Cargando tablero">
      {Array.from({ length: columns }).map((_, columnIndex) => (
        <div
          key={columnIndex}
          className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3"
        >
          <div className="skeleton mb-3 h-4 w-24" />
          <div className="space-y-2.5">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function desktopGridClass(columns: number): string {
  if (columns === 1) return "md:max-w-md";
  if (columns === 2) return "md:grid-cols-2";
  if (columns === 4) return "md:grid-cols-2 xl:grid-cols-4";
  return "md:grid-cols-3";
}
