import type { Task } from "@/lib/api/types";

interface TaskSelectorProps {
  pendingTasks: Task[];
  activeSelectedTaskId: string | undefined;
  onOpenDetail: (id: string) => void;
}

export function TaskSelector({
  pendingTasks,
  activeSelectedTaskId,
  onOpenDetail,
}: TaskSelectorProps) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Elegir tarea
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {pendingTasks.slice(0, 6).map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onOpenDetail(task.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              task.id === activeSelectedTaskId
                ? "bg-[var(--accent)] text-white shadow-lg"
                : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {task.title}
          </button>
        ))}
      </div>
    </div>
  );
}
