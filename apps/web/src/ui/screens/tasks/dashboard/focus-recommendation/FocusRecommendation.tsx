import { Sparkles } from "lucide-react";

import { StateCard } from "@/components/primitives/state-card";
import { CarryOverBadge } from "@/ui/screens/tasks/components/carry-over-badge";
import { TaskDomainBadge } from "@/ui/screens/tasks/components/task-domain-badge";
import { TaskPriorityBadge } from "@/ui/screens/tasks/components/task-priority-badge";
import type { FocusRecommendationItemVM } from "@/ui/models/tasks/FocusRecommendationViewModel";
import { useFocusRecommendationPresenter } from "./useFocusRecommendationPresenter";

export function FocusRecommendation() {
  const presenter = useFocusRecommendationPresenter();
  const vm = presenter.model;

  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">{vm.title}</h3>
      </div>

      {vm.items.length > 0 ? (
        <div className="mt-3.5 space-y-2.5">
          {vm.items.map((item) => (
            <FocusRecommendationItem
              key={item.id}
              item={item}
              onOpen={() => presenter.openFocus(item.id)}
            />
          ))}
        </div>
      ) : (
        vm.emptyState && (
          <div className="mt-4">
            <StateCard
              tone="soft"
              size="md"
              title={vm.emptyState.title}
              description={vm.emptyState.description}
            />
          </div>
        )
      )}
    </div>
  );
}

function FocusRecommendationItem({
  item,
  onOpen,
}: {
  item: FocusRecommendationItemVM;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-xl border p-3.5 text-left transition-all hover:shadow-sm ${item.className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-bold text-white">
          {item.rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[var(--foreground)]">{item.title}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <TaskPriorityBadge priority={item.priority} />
            <TaskDomainBadge domain={item.domain} />
            <CarryOverBadge count={item.carryOverCount} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{item.reason}</p>
        </div>
      </div>
    </button>
  );
}
