"use client";

import { TasksProvider } from "@/features/tasks/presentation/tasks-context";
import { OperationalHeader } from "@/features/tasks/presentation/components/operational-header";
import { QuickCaptureForm } from "@/features/tasks/presentation/components/quick-capture-form";
import { PlanningSignal } from "@/features/tasks/presentation/components/planning-signal";
import { FocusRecommendation } from "@/features/tasks/presentation/components/focus-recommendation";
import { ExecutionQueue } from "@/features/tasks/presentation/components/execution-queue";
import { NextBestAction, RecoveryBoard, WeeklyRhythm } from "@/features/tasks/presentation/components/sidebar-cards";
import { DetailPanel } from "@/features/tasks/presentation/components/detail-panel";
import { ClarificationGate } from "@/features/tasks/presentation/components/clarification-gate";
import { ModulePage } from "@/components/primitives/module-page";

export default function TasksDashboard() {
  return (
    <TasksProvider>
      <ModulePage width="6xl" spacing="8">
        <section className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <OperationalHeader />
          <QuickCaptureForm />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <PlanningSignal />
          <FocusRecommendation />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <ExecutionQueue />
          <div className="space-y-6">
            <NextBestAction />
            <DetailPanel />
            <RecoveryBoard />
            <WeeklyRhythm />
          </div>
        </section>

        <ClarificationGate />
      </ModulePage>
    </TasksProvider>
  );
}
