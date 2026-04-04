import { getFilterTasks } from "../tasks-dashboard-selectors";
import { useTasksData, useTasksActions } from "../use-tasks-context";
import { TaskRow } from "./task-row";
import { EmptyTaskList } from "@/components/tasks/empty-task-list";

export function ExecutionQueue() {
  const {
    tasks,
    visibleTasks,
    pendingTasks,
    doneTasks,
    filter,
    expandedTaskActions,
  } = useTasksData();
  const {
    setFilter,
    setExpandedTaskActions,
    completeTask,
    carryOverTask,
    discardTask,
    deleteTask,
    openBreakdownStudio,
    isTaskBusy,
  } = useTasksActions();

  const filterOptions = [
    { key: "focus" as const, label: "Focus", count: getFilterTasks([...tasks], "focus").length },
    { key: "pending" as const, label: "Pendientes", count: pendingTasks.length },
    { key: "done" as const, label: "Hechas", count: doneTasks.length },
    { key: "all" as const, label: "Todas", count: tasks.length },
  ];

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="border-b border-[var(--divider)] p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
              Cola de ejecucion
            </h3>
            <p className="mt-0.5 text-[13px] text-[var(--muted)]">
              Lo importante queda al frente
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === item.key
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay-strong)]"
                }`}
                style={filter === item.key ? { boxShadow: "0 2px 8px var(--accent-glow)" } : undefined}
              >
                {item.label} · {item.count}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2.5 p-4 md:p-5">
        {visibleTasks.length === 0 && <EmptyTaskList filter={filter} />}

        <div className="stagger-children space-y-3">
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              busy={isTaskBusy(task.id)}
              actionsOpen={expandedTaskActions === task.id}
              onComplete={completeTask}
              onCarryOver={carryOverTask}
              onDiscard={discardTask}
              onDelete={deleteTask}
              onOpenDetail={openBreakdownStudio}
              onToggleActions={setExpandedTaskActions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
