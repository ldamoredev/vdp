import { Sparkles } from "lucide-react";
import { StateCard } from "@/components/primitives/state-card";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";
import { useTasksData, useTasksActions } from "../use-tasks-context";

export function FocusRecommendation() {
  const { planning, activeSelectedTaskId } = useTasksData();
  const { openBreakdownStudio } = useTasksActions();

  const focusTasks = planning.focusTasks;

  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Focus recomendado
        </h3>
      </div>

      {focusTasks.length > 0 ? (
        <div className="mt-3.5 space-y-2.5">
          {focusTasks.map((task, index) => (
            <button
              key={task.id}
              type="button"
              onClick={() => openBreakdownStudio(task.id)}
              className={`w-full text-left rounded-xl border p-3.5 transition-all hover:shadow-sm ${
                task.id === activeSelectedTaskId
                  ? "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]"
                  : "border-[var(--glass-border)] bg-[var(--hover-overlay)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-bold text-white">
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
        <div className="mt-4">
          <StateCard
            tone="soft"
            size="md"
            title="No hay foco forzado para hoy."
            description="La cola esta liviana. Puedes capturar trabajo nuevo sin romper el plan."
          />
        </div>
      )}
    </div>
  );
}
