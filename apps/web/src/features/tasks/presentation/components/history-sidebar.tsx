import { AlertTriangle, Check, Trash2 } from "lucide-react";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";
import { useHistoryData } from "../use-history-context";

export function HistorySidebar() {
  const { review, completedTasks, discardedTasks } = useHistoryData();

  return (
    <div className="space-y-6">
      <div className="glass-card-static p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: "var(--amber-soft-text)" }} />
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Estado del cierre
          </h3>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
            <div className="text-xs text-[var(--muted)]">Pendientes</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {review?.pending ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
            <div className="text-xs text-[var(--muted)]">Reprogramadas</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {review?.carriedOver ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] p-4">
            <div className="text-xs text-[var(--muted)]">Descartadas</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {review?.discarded ?? 0}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card-static overflow-hidden">
        <div className="border-b border-[var(--glass-border)] p-4">
          <div className="flex items-center gap-2">
            <Check size={14} style={{ color: "var(--emerald-soft-text)" }} />
            <h3 className="text-sm font-medium text-[var(--foreground)]">
              Completadas
            </h3>
            <span className="ml-auto text-xs text-[var(--muted)]">
              {completedTasks.length}
            </span>
          </div>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <div key={task.id} className="p-3">
                <div className="text-sm text-[var(--muted)] line-through">
                  {task.title}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <TaskPriorityBadge priority={task.priority} />
                  <TaskDomainBadge domain={task.domain} />
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-xs text-[var(--muted)]">
              No hubo cierres en este dia.
            </div>
          )}
        </div>
      </div>

      {discardedTasks.length > 0 && (
        <div className="glass-card-static overflow-hidden">
          <div className="border-b border-[var(--glass-border)] p-4">
            <div className="flex items-center gap-2">
              <Trash2 size={14} style={{ color: "var(--red-soft-text)" }} />
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                Descartadas
              </h3>
              <span className="ml-auto text-xs text-[var(--muted)]">
                {discardedTasks.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-[var(--glass-border)]">
            {discardedTasks.map((task) => (
              <div key={task.id} className="p-3">
                <div className="text-sm text-[var(--muted)] line-through">
                  {task.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
