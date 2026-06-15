import { ModulePage } from "@/ui/primitives/module-page";
import type { TaskInsight } from "@/lib/api/types";
import { DailyReviewDecisions } from "./components/daily-review-decisions";
import { DailyReviewInsightsQueue } from "./components/daily-review-insights-queue";
import { DailyReviewScreen } from "./components/daily-review-screen";
import { DailyReviewTaskQueue } from "./components/daily-review-task-queue";
import { DailyReviewWalletQueue } from "./components/daily-review-wallet-queue";
import { ReviewWalletEditSheet } from "./components/review-wallet-edit-sheet";
import { useReviewPresenter } from "./useReviewPresenter";

export default function ReviewPage() {
  const presenter = useReviewPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="6xl" spacing="8">
      <DailyReviewScreen
        dateLabel={vm.dateLabel}
        progressLabel={vm.progressLabel}
        taskSection={
          <DailyReviewTaskQueue
            tasks={vm.taskQueue}
            onComplete={(id) => void presenter.completeTask(id)}
            onCarryOver={(id) => void presenter.carryOverTask(id)}
            onDiscard={(id) => void presenter.discardTask(id)}
            isTaskBusy={(id) => presenter.isTaskBusy(id)}
          />
        }
        walletSection={
          <DailyReviewWalletQueue
            signals={vm.wallet.signals}
            transactions={vm.wallet.transactions}
            summary={vm.wallet.summary}
            onAcknowledgeSignal={(id) => presenter.acknowledgeSignal(id)}
            onEditTransaction={(transaction) => presenter.openEdit(transaction)}
          />
        }
        insightsSection={
          <DailyReviewInsightsQueue
            insights={vm.insights as TaskInsight[]}
            onAcknowledgeInsight={(id) => presenter.acknowledgeInsight(id)}
          />
        }
        decisionsSection={
          <DailyReviewDecisions
            categories={vm.decisions.categories}
            note={vm.decisions.note}
            summary={vm.decisions.summary}
            onToggleCategory={(id) => presenter.toggleWatchedCategory(id)}
            onNoteChange={(value) => presenter.setNote(value)}
          />
        }
      />
      {vm.editSheet.open && vm.editSheet.transaction ? (
        <ReviewWalletEditSheet
          transaction={vm.editSheet.transaction}
          open={vm.editSheet.open}
          onClose={() => presenter.closeEdit()}
          onSaved={() => void presenter.transactionUpdated()}
        />
      ) : null}
    </ModulePage>
  );
}
