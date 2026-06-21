import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { RecurringPresenter } from "./RecurringPresenter";

export function useRecurringPresenter(): RecurringPresenter {
  const core = useCore();
  return usePresenter((onChange) => new RecurringPresenter(onChange, core), undefined, [core]);
}
