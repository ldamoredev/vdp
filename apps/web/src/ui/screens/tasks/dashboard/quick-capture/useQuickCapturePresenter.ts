import { usePresenter } from "@nbottarini/react-presenter";
import { useSearchParams } from "react-router";

import { useCore } from "@/CoreProvider";
import { useTasksDashboardStore } from "../tasks-dashboard-context";
import { QuickCapturePresenter } from "./QuickCapturePresenter";

export function useQuickCapturePresenter(): QuickCapturePresenter {
  const core = useCore();
  const store = useTasksDashboardStore();
  const [searchParams] = useSearchParams();
  const initialTitle = searchParams.get("capturar") ?? "";
  return usePresenter(
    (onChange) => new QuickCapturePresenter(onChange, store, core, initialTitle),
    undefined,
    [core, store, initialTitle],
  );
}
