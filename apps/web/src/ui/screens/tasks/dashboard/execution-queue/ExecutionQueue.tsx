import { EmptyTaskList } from "@/ui/screens/tasks/components/empty-task-list";
import { TaskRow, type TaskRowActions } from "./TaskRow";
import { useExecutionQueuePresenter } from "./useExecutionQueuePresenter";

export function ExecutionQueue() {
  const presenter = useExecutionQueuePresenter();
  const vm = presenter.model;

  const actions: TaskRowActions = {
    onComplete: (id) => void presenter.complete(id),
    onCarryOver: (id) => void presenter.carryOver(id),
    onDiscard: (id) => void presenter.discard(id),
    onDelete: (id) => void presenter.delete(id),
    onOpenDetail: (id) => presenter.openDetail(id),
    onToggleActions: (id) => presenter.setExpandedActions(id),
  };

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              Cola de ejecución
            </h3>
            <p className="mt-0.5 text-[13px] text-[var(--muted)]">Lo importante queda al frente</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {vm.filterOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => presenter.setFilter(item.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  vm.filter === item.key
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay-strong)]"
                }`}
                style={vm.filter === item.key ? { boxShadow: "0 2px 8px var(--accent-glow)" } : undefined}
              >
                {item.label} · {item.count}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2.5 p-4 md:p-5">
        {vm.error && !vm.isLoading && (
          <p className="p-2 text-sm text-[var(--red-soft-text)]">
            No se pudieron cargar las tareas. Probá recargar la página.
          </p>
        )}

        {vm.isLoading && <ExecutionQueueSkeleton />}

        {!vm.isLoading && !vm.error && vm.rows.length === 0 && <EmptyTaskList filter={vm.filter} />}

        {!vm.isLoading && (
          <div className="stagger-children space-y-3">
            {vm.rows.map((task) => (
              <TaskRow key={task.id} task={task} actions={actions} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExecutionQueueSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Cargando tareas">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="skeleton h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3 w-3/4" />
              <div className="skeleton h-2.5 w-1/2 md:hidden" />
            </div>
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <div className="skeleton h-5 w-14" />
              <div className="skeleton h-5 w-16" />
              <div className="skeleton h-8 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
