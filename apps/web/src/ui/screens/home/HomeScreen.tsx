import { useEffect, useState } from "react";
import { CrossDomainSignalsCard } from "@/ui/screens/home/components/cross-domain-signals-card";
import { DailyRitualCard } from "@/ui/screens/home/components/daily-ritual-card";
import { OnboardingModal } from "@/ui/screens/home/components/onboarding-modal";
import { OperationalRhythmCard } from "@/ui/screens/home/components/operational-rhythm-card";
import { TaskStatsRow } from "@/ui/screens/home/components/task-stats-row";
import { TodayTasksCard } from "@/ui/screens/home/components/today-tasks-card";
import { WalletSnapshotCard } from "@/ui/screens/home/components/wallet-snapshot-card";
import { WeeklyTrendCard } from "@/ui/screens/home/components/weekly-trend-card";
import {
  ONBOARDING_STEPS,
  completeOnboarding,
  setOnboardingChromeState,
  shouldOpenOnboarding,
} from "@/ui/screens/home/onboarding-storage";
import { useHomePresenter } from "./useHomePresenter";

export default function HomeScreen() {
  const presenter = useHomePresenter();
  const model = presenter.model;
  const [isOnboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

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
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {model.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {model.subtitle}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
            <span>{model.onlineLabel}</span>
          </div>
        </div>

        <TaskStatsRow stats={model.stats} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TodayTasksCard
              model={model.todayTasks}
              onTitleChange={(title) => presenter.setNewTaskTitle(title)}
              onCreate={() => void presenter.createTask()}
              onComplete={(taskId) => void presenter.completeTask(taskId)}
            />
            <DailyRitualCard model={model.ritual} />
          </div>

          <div className="space-y-6">
            <WalletSnapshotCard model={model.wallet} />
            <CrossDomainSignalsCard
              insights={model.signals}
              countLabel={model.signalCountLabel}
            />
            <WeeklyTrendCard trend={model.trend} />
            <OperationalRhythmCard rhythm={model.rhythm} />
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
