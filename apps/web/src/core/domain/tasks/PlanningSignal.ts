import type { Task } from "./Task";

export type PlanningTone = "success" | "info" | "warning" | "error";

export interface PlanningSignal {
  tone: PlanningTone;
  pendingCount: number;
  urgentCount: number;
  stuckCount: number;
  carryOverRate: number;
  focusTasks: Task[];
}

export function buildPlanningSignal(args: {
  tasks: readonly Task[];
  carryOverRate?: number;
}): PlanningSignal {
  const carryOverRate = args.carryOverRate ?? 0;
  const pendingTasks = args.tasks.filter((task) => task.isPending);
  const urgentTasks = pendingTasks.filter((task) => task.isHot);
  const stuckTasks = pendingTasks.filter((task) => task.isStuck);
  const focusTasks = urgentTasks.slice(0, 3);

  return {
    tone: classifyPlanningTone({
      pendingCount: pendingTasks.length,
      urgentCount: urgentTasks.length,
      stuckCount: stuckTasks.length,
      carryOverRate,
    }),
    pendingCount: pendingTasks.length,
    urgentCount: urgentTasks.length,
    stuckCount: stuckTasks.length,
    carryOverRate,
    focusTasks,
  };
}

function classifyPlanningTone(args: {
  pendingCount: number;
  urgentCount: number;
  stuckCount: number;
  carryOverRate: number;
}): PlanningTone {
  if (args.stuckCount > 0 || args.carryOverRate >= 50 || args.pendingCount >= 8) return "error";
  if (args.urgentCount >= 4 || args.carryOverRate >= 35 || args.pendingCount >= 5) return "warning";
  if (args.pendingCount === 0) return "success";
  return "info";
}
