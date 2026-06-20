import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { QuickAddExpensePresenter } from "./QuickAddExpensePresenter";

export function useQuickAddExpensePresenter(initialDescription = ""): QuickAddExpensePresenter {
  const core = useCore();
  return usePresenter(
    (onChange) => new QuickAddExpensePresenter(onChange, core, initialDescription),
    undefined,
    [core, initialDescription],
  );
}
