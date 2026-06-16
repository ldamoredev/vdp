import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { getTodayISO } from "@/lib/format";
import { MedicalPresenter } from "./MedicalPresenter";

export function useMedicalPresenter(): MedicalPresenter {
  const core = useCore();
  return usePresenter(
    (onChange) => new MedicalPresenter(onChange, core, getTodayISO()),
    undefined,
    [core],
  );
}
