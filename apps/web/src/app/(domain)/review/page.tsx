"use client";

import { ModulePage } from "@/components/primitives/module-page";
import { DailyReviewScreen } from "@/features/review/presentation/components/daily-review-screen";
import { useDailyReviewModel } from "@/features/review/presentation/use-daily-review-model";
import { EditTransactionSheet } from "@/features/wallet/presentation/edit-transaction/edit-transaction-sheet";
import { WalletProvider } from "@/features/wallet/presentation/wallet-context";

export default function ReviewPage() {
  const model = useDailyReviewModel();

  return (
    <ModulePage width="6xl" spacing="8">
      <DailyReviewScreen {...model.screenProps} />
      {model.editSheetProps.open && model.editSheetProps.transaction ? (
        <WalletProvider scope="transactions">
          <EditTransactionSheet
            transaction={model.editSheetProps.transaction}
            open={model.editSheetProps.open}
            onClose={model.editSheetProps.onClose}
          />
        </WalletProvider>
      ) : null}
    </ModulePage>
  );
}
