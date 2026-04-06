"use client";

import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/lib/api/wallet";
import { tasksApi } from "@/lib/api/tasks";
import { getTodayISO } from "@/lib/format";
import { homeTaskQueryKeys } from "@/features/tasks/presentation/tasks-query-keys";
import { walletQueryKeys } from "@/features/wallet/presentation/wallet-query-keys";
import { TaskStatsRow } from "@/components/home/task-stats-row";
import { TodayTasksCard } from "@/components/home/today-tasks-card";
import { DayReviewCard } from "@/components/home/day-review-card";
import { WeeklyTrendCard } from "@/components/home/weekly-trend-card";
import { WalletSnapshotCard } from "@/components/home/wallet-snapshot-card";
import { ProductFocusCard } from "@/components/home/product-focus-card";

export default function HomePage() {
  const today = getTodayISO();

  const { data: taskStats } = useQuery({
    queryKey: homeTaskQueryKeys.taskStats,
    queryFn: tasksApi.getTodayStats,
  });

  const { data: todayTasks } = useQuery({
    queryKey: homeTaskQueryKeys.tasksToday(today),
    queryFn: () => tasksApi.getTasks({ scheduledDate: today, limit: "5" }),
  });

  const { data: review } = useQuery({
    queryKey: homeTaskQueryKeys.review(today),
    queryFn: () => tasksApi.getReview(today),
  });

  const { data: trend } = useQuery({
    queryKey: homeTaskQueryKeys.trend(7),
    queryFn: () => tasksApi.getTrend(7),
  });

  const { data: walletStats, isLoading: isLoadingWalletStats } = useQuery({
    queryKey: walletQueryKeys.statsSummary,
    queryFn: () => walletApi.getStatsSummary(),
  });

  const {
    data: walletRecentTransactions,
    isLoading: isLoadingWalletRecentTransactions,
  } = useQuery({
    queryKey: walletQueryKeys.recentTransactions,
    queryFn: () => walletApi.getTransactions({ limit: "10" }),
  });
  const isLoadingWallet = isLoadingWalletStats || isLoadingWalletRecentTransactions;

  const tasksCompleted = taskStats?.completed ?? 0;
  const tasksTotal = taskStats?.total ?? 0;
  const tasksPending = taskStats?.pending ?? 0;
  const tasksPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const activeTasks = todayTasks?.tasks ?? [];
  const recentWalletTransactions = walletRecentTransactions?.transactions ?? [];
  const averageCompletion = trend?.length
    ? Math.round(trend.reduce((acc, day) => acc + day.completionRate, 0) / trend.length)
    : 0;
  const carriedToday = activeTasks.filter((task) => task.carryOverCount > 0).length;

  return (
    <div className="max-w-6xl space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Centro de comando
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tu sistema operativo personal — un dominio a la vez
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
          <span>En línea</span>
        </div>
      </div>

      {/* Stats row */}
      <TaskStatsRow
        tasksCompleted={tasksCompleted}
        tasksTotal={tasksTotal}
        tasksPending={tasksPending}
        tasksPct={tasksPct}
        averageCompletion={averageCompletion}
      />

      {/* Main content grid */}
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
          <WalletSnapshotCard
            stats={walletStats}
            recentTransactions={recentWalletTransactions}
            isLoading={isLoadingWallet}
          />
          <WeeklyTrendCard trend={trend} />
          <ProductFocusCard />
        </div>
      </div>
    </div>
  );
}
