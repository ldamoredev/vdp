import { usePresenter } from "@nbottarini/react-presenter";

import { useCore } from "@/CoreProvider";
import { InboxPresenter } from "./InboxPresenter";

export function useInboxPresenter(): InboxPresenter {
  const core = useCore();
  return usePresenter((onChange) => new InboxPresenter(onChange, core), undefined, [core]);
}
