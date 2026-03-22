import { Task, TaskStatus } from '../../domain/Task';
import { randomUUID } from 'crypto';
import { todayISO } from '../../../common/base/time/dates';

type TaskOverrides = Partial<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: number;
    scheduledDate: string;
    domain: string | null;
    completedAt: Date | null;
    carryOverCount: number;
    createdAt: Date;
    updatedAt: Date;
}>;

export function createTask(overrides: TaskOverrides = {}): Task {
    const now = new Date();
    return new Task(
        overrides.id ?? randomUUID(),
        overrides.createdAt ?? now,
        overrides.description ?? null,
        overrides.updatedAt ?? now,
        overrides.completedAt ?? null,
        overrides.title ?? "Test task",
        overrides.status ?? "pending",
        overrides.priority ?? 2,
        overrides.scheduledDate ?? todayISO(),
        overrides.domain ?? null,
        overrides.carryOverCount ?? 0,
    );
}
