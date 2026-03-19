import { Task } from './Task';

export abstract class TaskRepository {
    // ─── CRUD ────────────────────────────────────────────
    abstract getTask(id: string): Promise<Task | null>;
    abstract listTasks(filters: TaskFilters): Promise<PagedTasks>;
    abstract createTask(data: CreateTaskData): Promise<Task>;
    abstract updateTask(id: string, data: UpdateTaskData): Promise<Task | null>;
    abstract deleteTask(id: string): Promise<Task | null>;

    // ─── Persistence (save entity state) ─────────────────
    abstract save(task: Task): Promise<Task>;

    // ─── Queries ─────────────────────────────────────────
    abstract getTasksByDateAndStatus(date: string, status: string): Promise<Task[]>;
    abstract getTasksByDate(date: string): Promise<Task[]>;
    abstract countByDateAndStatus(date: string, status: string): Promise<number>;

    // ─── Stats ───────────────────────────────────────────
    abstract getCompletionByDomain(from?: string, to?: string): Promise<DomainStat[]>;
    abstract getCarryOverStats(fromDate: string, toDate: string): Promise<CarryOverStats>;
}

export type TaskFilters = {
    scheduledDate?: string;
    status?: string;
    domain?: string;
    priority?: number;
    limit?: number;
    offset?: number;
};

export type PagedTasks = {
    tasks: Task[];
    total: number;
    limit: number;
    offset: number;
};

export type CreateTaskData = {
    title: string;
    description?: string | null;
    priority?: number;
    scheduledDate?: string;
    domain?: string | null;
};

export type UpdateTaskData = {
    title?: string;
    description?: string | null;
    priority?: number;
    scheduledDate?: string;
    domain?: string | null;
};

export type DomainStat = {
    domain: string | null;
    count: number;
};

export type CarryOverStats = {
    total: number;
    carriedOver: number;
};
