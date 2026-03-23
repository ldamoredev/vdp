import { Sparkles } from "lucide-react";
import type { Task } from "@/lib/api/types";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";

interface FocusRecommendationProps {
  focusTasks: Task[];
  activeSelectedTaskId: string | undefined;
  onOpenDetail: (id: string) => void;
}

export function FocusRecommendation({
  focusTasks,
  activeSelectedTaskId,
  onOpenDetail,
}: FocusRecommendationProps) {
  return (
    <div className="glass-card-static p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Focus recomendado
        </h3>
      </div>

      {focusTasks.length > 0 ? (
        <div className="mt-4 space-y-3">
          {focusTasks.map((task, index) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpenDetail(task.id)}
              className={`rounded-[24px] border p-4 ${
                task.id === activeSelectedTaskId
                  ? "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]"
                  : "border-[var(--glass-border)] bg-[var(--hover-overlay)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--foreground)]">
                    {task.title}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <TaskPriorityBadge priority={task.priority} />
                    <TaskDomainBadge domain={task.domain} />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                    {task.carryOverCount > 0
                      ? `Arrastra ${task.carryOverCount} carry-over. Conviene resolverla temprano.`
                      : "Tiene el mejor balance entre prioridad y urgencia para entrar en foco hoy."}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[24px] border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-5 py-10 text-center">
          <p className="text-sm font-medium text-[var(--foreground)]">
            No hay foco forzado para hoy.
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            La cola esta liviana. Puedes capturar trabajo nuevo sin romper el plan.
          </p>
        </div>
      )}
    </div>
  );
}
