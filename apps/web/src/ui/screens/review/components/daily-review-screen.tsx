import type { ReactNode } from "react";
import { DailyReviewHeader } from "./daily-review-header";

interface DailyReviewScreenProps {
  dateLabel: string;
  progressLabel: string;
  taskSection: ReactNode;
  moodSection: ReactNode;
  walletSection: ReactNode;
  insightsSection: ReactNode;
  decisionsSection: ReactNode;
}

export function DailyReviewScreen({
  dateLabel,
  progressLabel,
  taskSection,
  moodSection,
  walletSection,
  insightsSection,
  decisionsSection,
}: DailyReviewScreenProps) {
  return (
    <div className="space-y-6">
      <DailyReviewHeader
        dateLabel={dateLabel}
        progressLabel={progressLabel}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {taskSection}
          {walletSection}
          {insightsSection}
        </div>
        <div className="space-y-6">
          {moodSection}
          {decisionsSection}
        </div>
      </div>
    </div>
  );
}
