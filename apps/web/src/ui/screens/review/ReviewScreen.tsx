import { ModulePage } from "@/ui/primitives/module-page";
import { DailyReviewScreen } from "@/features/review/components/daily-review-screen";
import { ReviewWalletEditSheet } from "@/features/review/components/review-wallet-edit-sheet";
import { useDailyReviewModel } from "@/features/review/use-daily-review-model";

export default function ReviewPage() {
  const model = useDailyReviewModel();

  return (
    <ModulePage width="6xl" spacing="8">
      <DailyReviewScreen {...model.screenProps} />
      {model.editSheetProps.open && model.editSheetProps.transaction ? (
        <ReviewWalletEditSheet
          transaction={model.editSheetProps.transaction}
          open={model.editSheetProps.open}
          onClose={model.editSheetProps.onClose}
        />
      ) : null}
    </ModulePage>
  );
}
