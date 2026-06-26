import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { ClientManagerPresenter } from "./ClientManagerPresenter";

export function useClientManagerPresenter(onChanged?: () => void): ClientManagerPresenter {
  const core = useCore();
  return usePresenter(
    (onChange) => new ClientManagerPresenter(onChange, core, onChanged),
    undefined,
    [core],
  );
}
