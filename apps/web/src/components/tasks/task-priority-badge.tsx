import { priorityBadge, priorityLabel } from "@/lib/format";

interface TaskPriorityBadgeProps {
  priority: number;
  className?: string;
}

export function TaskPriorityBadge({ priority, className = "" }: TaskPriorityBadgeProps) {
  return (
    <span className={`badge text-[10px] ${priorityBadge(priority)} ${className}`}>
      {priorityLabel(priority)}
    </span>
  );
}
