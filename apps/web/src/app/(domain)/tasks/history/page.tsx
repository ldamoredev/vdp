"use client";

import { HistoryProvider } from "@/features/tasks/presentation/history-context";
import { HistoryReviewHeader } from "@/features/tasks/presentation/components/history-review-header";
import { HistoryReviewSignals } from "@/features/tasks/presentation/components/history-review-signals";
import { HistoryClosureQueue } from "@/features/tasks/presentation/components/history-closure-queue";
import { HistorySidebar } from "@/features/tasks/presentation/components/history-sidebar";
import { HistoryTrendChart } from "@/features/tasks/presentation/components/history-trend-chart";
import { HistoryDomainStats } from "@/features/tasks/presentation/components/history-domain-stats";

export default function HistoryPage() {
  return (
    <HistoryProvider>
      <div className="max-w-6xl space-y-8 animate-fade-in">
        <HistoryReviewHeader />
        <HistoryReviewSignals />

        <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <HistoryClosureQueue />
          <HistorySidebar />
        </section>

        <HistoryTrendChart />
        <HistoryDomainStats />
      </div>
    </HistoryProvider>
  );
}
