import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { HoursReportPresenter } from "./HoursReportPresenter";

export function useHoursReportPresenter(): HoursReportPresenter {
  const core = useCore();
  return usePresenter((onChange) => new HoursReportPresenter(onChange, core), undefined, [core]);
}
