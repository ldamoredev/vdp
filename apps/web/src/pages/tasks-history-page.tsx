import { HistoryProvider } from "@/features/tasks/history-context";
import { HistoryReviewHeader } from "@/features/tasks/components/history-review-header";
import { HistoryReviewSignals } from "@/features/tasks/components/history-review-signals";
import { HistoryClosureQueue } from "@/features/tasks/components/history-closure-queue";
import { HistorySidebar } from "@/features/tasks/components/history-sidebar";
import { HistoryTrendChart } from "@/features/tasks/components/history-trend-chart";
import { HistoryDomainStats } from "@/features/tasks/components/history-domain-stats";
import { ModulePage } from "@/components/primitives/module-page";

export default function HistoryPage() {
  return (
    <HistoryProvider>
      <ModulePage width="6xl" spacing="8">
        <HistoryReviewHeader />
        <HistoryReviewSignals />

        <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <HistoryClosureQueue />
          <HistorySidebar />
        </section>

        <HistoryTrendChart />
        <HistoryDomainStats />
      </ModulePage>
    </HistoryProvider>
  );
}
