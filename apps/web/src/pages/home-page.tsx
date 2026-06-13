import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/features/wallet/wallet-api";
import { tasksApi } from "@/features/tasks/tasks-api";
import { getTodayISO } from "@/lib/format";
import { homeTaskQueryKeys } from "@/features/home/home-query-keys";
import {
  buildDailyReviewProgress,
  buildMorningReviewSummary,
  buildWalletReviewSignals,
} from "@/features/review/daily-review-selectors";
import {
  createEmptyDailyReviewState,
  loadDailyReviewState,
} from "@/features/review/daily-review-storage";
import { walletQueryKeys } from "@/features/wallet/wallet-query-keys";
import { TaskStatsRow } from "@/features/home/components/task-stats-row";
import { TodayTasksCard } from "@/features/home/components/today-tasks-card";
import { DailyRitualCard } from "@/features/home/components/daily-ritual-card";
import { WeeklyTrendCard } from "@/features/home/components/weekly-trend-card";
import { WalletSnapshotCard } from "@/features/home/components/wallet-snapshot-card";
import { OperationalRhythmCard } from "@/features/home/components/operational-rhythm-card";
import { CrossDomainSignalsCard } from "@/features/home/components/cross-domain-signals-card";
import { OnboardingModal } from "@/features/home/components/onboarding-modal";
import {
  ONBOARDING_STEPS,
  completeOnboarding,
  setOnboardingChromeState,
  shouldOpenOnboarding,
} from "@/features/home/onboarding-storage";

export default function HomePage() {
  const today = getTodayISO();
  const [reviewState, setReviewState] = useState(() =>
    createEmptyDailyReviewState(today),
  );
  const [isOnboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

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

  const { data: recentInsights } = useQuery({
    queryKey: ["home", "tasks", "insights"],
    queryFn: () => tasksApi.getRecentInsights(5),
  });

  const { data: carryOverRate } = useQuery({
    queryKey: ["home", "tasks", "carry-over-rate", 7],
    queryFn: () => tasksApi.getCarryOverRate(7),
  });

  const { data: completionByDomain } = useQuery({
    queryKey: ["home", "tasks", "by-domain"],
    queryFn: () => tasksApi.getByDomain(),
  });

  const { data: reviewWalletTransactions } = useQuery({
    queryKey: ["home", "review", "wallet", "transactions", today],
    queryFn: () =>
      walletApi.getTransactions({
        limit: "50",
        offset: "0",
        from: today,
        to: today,
      }),
  });

  const { data: reviewWalletByCategory } = useQuery({
    queryKey: ["home", "review", "wallet", "by-category", today],
    queryFn: () =>
      walletApi.getStatsByCategory({
        from: today,
        to: today,
      }),
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
  const todayWalletSignals = buildWalletReviewSignals({
    transactions: reviewWalletTransactions?.transactions ?? [],
    byCategory: reviewWalletByCategory ?? [],
    acknowledgedSignalIds: reviewState.acknowledgedSignalIds,
  });
  const unresolvedInsights = (recentInsights ?? []).filter(
    (insight) =>
      !insight.read &&
      !reviewState.acknowledgedSignalIds.includes(`insight:${insight.id}`),
  );
  const ritualProgress = buildDailyReviewProgress({
    pendingTasks: review?.pending ?? tasksPending,
    unresolvedWalletSignals: todayWalletSignals.visibleSignals.length,
    unresolvedInsights: unresolvedInsights.length,
    note: reviewState.note,
  });
  const ritualSummary = buildMorningReviewSummary({
    watchedCategoryNames: [],
    note: reviewState.note,
  });
  const ritualStatusLabel = reviewState.completedAt
    ? "Ritual cerrado"
    : reviewState.openedAt
      ? ritualProgress.label
      : "Listo para empezar";
  const ritualCtaLabel = reviewState.completedAt
    ? "Ver cierre de hoy"
    : reviewState.openedAt
      ? "Retomar ritual"
      : "Iniciar ritual";

  useEffect(() => {
    setReviewState(loadDailyReviewState(today));
  }, [today]);

  useEffect(() => {
    function syncOnboardingState() {
      const shouldOpen = shouldOpenOnboarding(window.localStorage);
      setOnboardingOpen((currentOpen) => {
        if (shouldOpen && !currentOpen) {
          setOnboardingStep(0);
        }

        return shouldOpen;
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        syncOnboardingState();
      }
    }

    syncOnboardingState();

    window.addEventListener("focus", syncOnboardingState);
    window.addEventListener("storage", syncOnboardingState);
    window.addEventListener("pageshow", syncOnboardingState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncOnboardingState);
      window.removeEventListener("storage", syncOnboardingState);
      window.removeEventListener("pageshow", syncOnboardingState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setOnboardingChromeState(document.documentElement, isOnboardingOpen);

    return () => {
      setOnboardingChromeState(document.documentElement, false);
    };
  }, [isOnboardingOpen]);

  function handleOnboardingNext() {
    if (onboardingStep >= ONBOARDING_STEPS.length - 1) {
      completeOnboarding(window.localStorage);
      setOnboardingOpen(false);
      return;
    }

    setOnboardingStep((currentStep) => currentStep + 1);
  }

  return (
    <>
      <div className="max-w-6xl space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
          <DailyRitualCard
            statusLabel={ritualStatusLabel}
            href="/review"
            ctaLabel={ritualCtaLabel}
            taskCount={review?.pending ?? tasksPending}
            walletCount={todayWalletSignals.visibleSignals.length}
            insightCount={unresolvedInsights.length}
            noteSummary={ritualSummary || undefined}
          />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <WalletSnapshotCard
            stats={walletStats}
            recentTransactions={recentWalletTransactions}
            isLoading={isLoadingWallet}
          />
          <CrossDomainSignalsCard insights={recentInsights ?? []} />
          <WeeklyTrendCard trend={trend} />
          <OperationalRhythmCard carryOver={carryOverRate} byDomain={completionByDomain} />
        </div>
      </div>
      </div>

      <OnboardingModal
        open={isOnboardingOpen}
        stepIndex={onboardingStep}
        onNext={handleOnboardingNext}
      />
    </>
  );
}
