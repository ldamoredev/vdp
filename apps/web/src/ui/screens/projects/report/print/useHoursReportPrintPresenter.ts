import { usePresenter } from "@nbottarini/react-presenter";
import { useSearchParams } from "react-router";

import { useCore } from "@/CoreProvider";
import { addLocalDaysISO, getTodayISO } from "@/lib/format";
import { HoursReportPrintPresenter } from "./HoursReportPrintPresenter";

export function useHoursReportPrintPresenter(): HoursReportPrintPresenter {
  const core = useCore();
  const [searchParams] = useSearchParams();
  const fromDate = searchParams.get("from") ?? addLocalDaysISO(getTodayISO(), -30);
  const toDate = searchParams.get("to") ?? getTodayISO();
  return usePresenter(
    (onChange) => new HoursReportPrintPresenter(onChange, core, fromDate, toDate),
    undefined,
    [core, fromDate, toDate],
  );
}
