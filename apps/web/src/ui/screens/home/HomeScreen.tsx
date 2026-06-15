import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCore } from "@/CoreProvider";
import { GetCarryOverRate } from "@/core/app/tasks/GetCarryOverRate";
import { GetRecentInsights } from "@/core/app/tasks/GetRecentInsights";
import { GetTaskReview } from "@/core/app/tasks/GetTaskReview";
import { GetTaskTrend } from "@/core/app/tasks/GetTaskTrend";
import { GetTasksByDomain } from "@/core/app/tasks/GetTasksByDomain";
import { GetTodayStats } from "@/core/app/tasks/GetTodayStats";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import { GetTransactions } from "@/core/app/wallet/GetTransactions";
import { GetWalletStatsByCategory } from "@/core/app/wallet/GetWalletStatsByCategory";
import { GetWalletStatsSummary } from "@/core/app/wallet/GetWalletStatsSummary";
import { getTodayISO } from "@/lib/format";
import { homeTaskQueryKeys } from "@/ui/screens/home/home-query-keys";
import {
  buildDailyReviewProgress,
  buildMorningReviewSummary,
  buildWalletReviewSignals,
} from "@/ui/screens/review/daily-review-selectors";
import {
  createEmptyDailyReviewState,
  loadDailyReviewState,
} from "@/ui/screens/review/daily-review-storage";
import { TaskStatsRow } from "@/ui/screens/home/components/task-stats-row";
import { TodayTasksCard } from "@/ui/screens/home/components/today-tasks-card";
import { DailyRitualCard } from "@/ui/screens/home/components/daily-ritual-card";
import { WeeklyTrendCard } from "@/ui/screens/home/components/weekly-trend-card";
import { WalletSnapshotCard } from "@/ui/screens/home/components/wallet-snapshot-card";
import { OperationalRhythmCard } from "@/ui/screens/home/components/operational-rhythm-card";
import { CrossDomainSignalsCard } from "@/ui/screens/home/components/cross-domain-signals-card";
import { OnboardingModal } from "@/ui/screens/home/components/onboarding-modal";
import {
  ONBOARDING_STEPS,
  completeOnboarding,
  setOnboardingChromeState,
  shouldOpenOnboarding,
} from "@/ui/screens/home/onboarding-storage";

export default function HomePage() {
  const core = useCore();
  const today = getTodayISO();
  const [reviewState, setReviewState] = useState(() =>
    createEmptyDailyReviewState(today),
  );
  const [isOnboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const { data: taskStats } = useQuery({
    queryKey: homeTaskQueryKeys.taskStats,
    queryFn: () => core.execute(new GetTodayStats()),
  });

  const { data: todayTasks } = useQuery({
    queryKey: homeTaskQueryKeys.tasksToday(today),
    queryFn: () => core.execute(new ListTasks({ scheduledDate: today, limit: "5" })),
  });

  const { data: review } = useQuery({
    queryKey: homeTaskQueryKeys.review(today),
    queryFn: () => core.execute(new GetTaskReview(today)),
  });

  const { data: trend } = useQuery({
    queryKey: homeTaskQueryKeys.trend(7),
    queryFn: () => core.execute(new GetTaskTrend(7)),
  });

  const { data: recentInsights } = useQuery({
    queryKey: ["home", "tasks", "insights"],
    queryFn: () => core.execute(new GetRecentInsights(5)),
  });

  const { data: carryOverRate } = useQuery({
    queryKey: ["home", "tasks", "carry-over-rate", 7],
    queryFn: () => core.execute(new GetCarryOverRate(7)),
  });

  const { data: completionByDomain } = useQuery({
    queryKey: ["home", "tasks", "by-domain"],
    queryFn: () => core.execute(new GetTasksByDomain()),
  });

  const { data: reviewWalletTransactions } = useQuery({
    queryKey: ["home", "review", "wallet", "transactions", today],
    queryFn: () =>
      core.execute(new GetTransactions({
        limit: "50",
        offset: "0",
        from: today,
        to: today,
      })),
  });

  const { data: reviewWalletByCategory } = useQuery({
    queryKey: ["home", "review", "wallet", "by-category", today],
    queryFn: () =>
      core.execute(new GetWalletStatsByCategory({
        from: today,
        to: today,
      })),
  });

  const { data: walletStats, isLoading: isLoadingWalletStats } = useQuery({
    queryKey: ["home", "wallet", "stats-summary"],
    queryFn: () => core.execute(new GetWalletStatsSummary()),
  });

  const {
    data: walletRecentTransactions,
    isLoading: isLoadingWalletRecentTransactions,
  } = useQuery({
    queryKey: ["home", "wallet", "recent-transactions"],
    queryFn: () => core.execute(new GetTransactions({ limit: "10" })),
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
