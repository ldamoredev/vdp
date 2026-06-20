import { CarryOverBadge } from "./carry-over-badge";
import { TaskDomainBadge } from "./task-domain-badge";
import { TaskPriorityBadge } from "./task-priority-badge";

interface TaskBadgesProps {
  priority: number;
  domain: string | null;
  carryOverCount: number;
}

/**
 * Priority + domain + carry-over pills for a task, in order. Shared by the
 * dashboard row and the board card so they stay in lock-step. Render inside a
 * flex row that owns the gap.
 */
export function TaskBadges({ priority, domain, carryOverCount }: TaskBadgesProps) {
  return (
    <>
      <TaskPriorityBadge priority={priority} />
      <TaskDomainBadge domain={domain} />
      <CarryOverBadge count={carryOverCount} />
    </>
  );
}
