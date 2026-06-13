import type { Task as TaskDto, TaskStatus } from "@vdp/shared";

export type TaskFilter = "focus" | "pending" | "done" | "all";

/** Carry-over count at or above which a task is considered stuck. */
const STUCK_CARRY_OVER = 3;

/**
 * A task. Rich model: it owns the pending/stuck/hot classification the views
 * read off raw fields. Mutations go through the gateway (commands), so the
 * model is read-only. Spanish-facing labels and CSS tone classes stay in the
 * presenter — this layer is presentation-free.
 */
export class Task {
  private constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string | null,
    readonly priority: number,
    readonly status: TaskStatus,
    readonly scheduledDate: string,
    readonly domain: string | null,
    readonly carryOverCount: number,
    readonly completedAt: string | null,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(dto: TaskDto): Task {
    return new Task(
      dto.id,
      dto.title,
      dto.description,
      dto.priority,
      dto.status,
      dto.scheduledDate,
      dto.domain,
      dto.carryOverCount,
      dto.completedAt,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  get isPending(): boolean {
    return this.status === "pending";
  }

  get isDone(): boolean {
    return this.status === "done";
  }

  /** Carried over enough times to need an explicit decision, not more waiting. */
  get isStuck(): boolean {
    return this.carryOverCount >= STUCK_CARRY_OVER;
  }

  /** A pending task that deserves focus today: high priority or already carried over. */
  get isHot(): boolean {
    return this.isPending && (this.priority >= 2 || this.carryOverCount > 0);
  }
}

/** Execution order: pending before done, most carried-over first, then priority, then age. */
export function sortExecutionQueue(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "pending" ? -1 : 1;
    }
    if (left.carryOverCount !== right.carryOverCount) {
      return right.carryOverCount - left.carryOverCount;
    }
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }
    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function filterTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  if (filter === "pending") return tasks.filter((task) => task.isPending);
  if (filter === "done") return tasks.filter((task) => task.isDone);
  if (filter === "focus") return tasks.filter((task) => task.isHot);
  return [...tasks];
}
