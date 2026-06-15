import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { getTodayISO } from "@/lib/format";
import { InvestmentsPresenter } from "./InvestmentsPresenter";

export function useInvestmentsPresenter(): InvestmentsPresenter {
  const core = useCore();
  return usePresenter(
    (onChange) => new InvestmentsPresenter(onChange, core, getTodayISO()),
    undefined,
    [core],
  );
}
