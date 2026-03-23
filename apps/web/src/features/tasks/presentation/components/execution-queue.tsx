import { CheckCheck } from "lucide-react";
import type { Task } from "@/lib/api/types";
import { getFilterTasks, type TaskFilter } from "../tasks-dashboard-selectors";
import { TaskRow } from "./task-row";

interface ExecutionQueueProps {
  tasks: Task[];
  visibleTasks: Task[];
  pendingTasks: Task[];
  doneTasks: Task[];
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
  expandedTaskActions: string | null;
  setExpandedTaskActions: (id: string | null) => void;
  isTaskBusy: (id: string) => boolean;
  onComplete: (id: string) => void;
  onCarryOver: (id: string) => void;
  onDiscard: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

export function ExecutionQueue({
  tasks,
  visibleTasks,
  pendingTasks,
  doneTasks,
  filter,
  setFilter,
  expandedTaskActions,
  setExpandedTaskActions,
  isTaskBusy,
  onComplete,
  onCarryOver,
  onDiscard,
  onDelete,
  onOpenDetail,
}: ExecutionQueueProps) {
  const filterOptions = [
    { key: "focus" as const, label: "Focus", count: getFilterTasks(tasks, "focus").length },
    { key: "pending" as const, label: "Pendientes", count: pendingTasks.length },
    { key: "done" as const, label: "Hechas", count: doneTasks.length },
    { key: "all" as const, label: "Todas", count: tasks.length },
  ];

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--glass-border)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Cola de ejecucion
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Acciones visibles, sin hover escondido. Lo importante queda al
              frente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  filter === item.key
                    ? "bg-[var(--accent)] text-white shadow-lg"
                    : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {item.label} · {item.count}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {visibleTasks.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--violet-soft-bg)]">
              <CheckCheck
                size={24}
                style={{ color: "var(--violet-soft-text)", opacity: 0.8 }}
              />
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
              {filter === "focus"
                ? "No hay nada urgente en la cola."
                : filter === "pending"
                  ? "No quedan pendientes para hoy."
                  : filter === "done"
                    ? "Todavia no cerraste tareas hoy."
                    : "No hay tareas para esta fecha."}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Usa captura rapida o conversa con el asistente para cargar el
              siguiente bloque de trabajo.
            </p>
          </div>
        )}

        {visibleTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            busy={isTaskBusy(task.id)}
            actionsOpen={expandedTaskActions === task.id}
            onComplete={onComplete}
            onCarryOver={onCarryOver}
            onDiscard={onDiscard}
            onDelete={onDelete}
            onOpenDetail={onOpenDetail}
            onToggleActions={setExpandedTaskActions}
          />
        ))}
      </div>
    </div>
  );
}
