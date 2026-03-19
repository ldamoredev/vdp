import { Task } from '../../domain/Task';
import { randomUUID } from 'crypto';

type TaskOverrides = Partial<{
    id: string;
    title: string;
    description: string | null;
    status: string;
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
        overrides.scheduledDate ?? now.toISOString().slice(0, 10),
        overrides.domain ?? null,
        overrides.carryOverCount ?? 0,
    );
}
