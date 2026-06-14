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
              Cola de ejecucion
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
                    ? "bg-[var(--accent)] text-white"
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

        {!vm.error && vm.rows.length === 0 && <EmptyTaskList filter={vm.filter} />}

        <div className="stagger-children space-y-3">
          {vm.rows.map((task) => (
            <TaskRow key={task.id} task={task} actions={actions} />
          ))}
        </div>
      </div>
    </div>
  );
}
