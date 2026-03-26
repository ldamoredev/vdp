"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/tasks";
import { getTodayISO } from "@/lib/format";
import { domains } from "@/lib/navigation";
import { TaskStatsRow } from "@/components/home/task-stats-row";
import { TodayTasksCard } from "@/components/home/today-tasks-card";
import { DayReviewCard } from "@/components/home/day-review-card";
import { WeeklyTrendCard } from "@/components/home/weekly-trend-card";
import { DisabledDomainsCard } from "@/components/home/disabled-domains-card";

const disabledDomains = domains.filter((d) => d.disabled);

export default function HomePage() {
  const today = getTodayISO();

  const { data: taskStats } = useQuery({
    queryKey: ["home", "task-stats"],
    queryFn: tasksApi.getTodayStats,
  });

  const { data: todayTasks } = useQuery({
    queryKey: ["home", "tasks-today"],
    queryFn: () => tasksApi.getTasks({ scheduledDate: today, limit: "5" }),
  });

  const { data: review } = useQuery({
    queryKey: ["home", "review", today],
    queryFn: () => tasksApi.getReview(today),
  });

  const { data: trend } = useQuery({
    queryKey: ["home", "trend", 7],
    queryFn: () => tasksApi.getTrend(7),
  });

  const tasksCompleted = taskStats?.completed ?? 0;
  const tasksTotal = taskStats?.total ?? 0;
  const tasksPending = taskStats?.pending ?? 0;
  const tasksPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const activeTasks = todayTasks?.tasks ?? [];
  const averageCompletion = trend?.length
    ? Math.round(trend.reduce((acc, day) => acc + day.completionRate, 0) / trend.length)
    : 0;
  const carriedToday = activeTasks.filter((task) => task.carryOverCount > 0).length;

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Centro de comando
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tu sistema operativo personal — un dominio a la vez
        </p>
      </div>

      {/* ─── Active: Tasks stats row ─── */}
      <TaskStatsRow
        tasksCompleted={tasksCompleted}
        tasksTotal={tasksTotal}
        tasksPending={tasksPending}
        tasksPct={tasksPct}
        averageCompletion={averageCompletion}
      />

      {/* ─── Main content grid ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TodayTasksCard tasks={activeTasks} />
          <DayReviewCard
            total={review?.total ?? 0}
            completed={review?.completed ?? 0}
            carriedToday={carriedToday}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <WeeklyTrendCard trend={trend} />
          <DisabledDomainsCard domains={disabledDomains} />
        </div>
      </div>
    </div>
  );
}
