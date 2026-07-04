import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { AdminSettingsPresenter } from "./AdminSettingsPresenter";

export function useAdminSettingsPresenter(): AdminSettingsPresenter {
  const core = useCore();
  return usePresenter((onChange) => new AdminSettingsPresenter(onChange, core), undefined, [core]);
}
