import { Task, TaskStatus } from './Task';

export abstract class TaskRepository {
    abstract getTask(userId: string, id: string): Promise<Task | null>;
    abstract getTasksByIds(userId: string, ids: string[]): Promise<Task[]>;
    abstract listTasks(userId: string, filters: TaskFilters): Promise<PagedTasks>;
    abstract createTask(userId: string, data: CreateTaskData): Promise<Task>;
    abstract updateTask(userId: string, id: string, data: UpdateTaskData): Promise<Task | null>;
    abstract deleteTask(userId: string, id: string): Promise<Task | null>;

    abstract save(userId: string, task: Task): Promise<Task>;

    abstract getTasksByDateAndStatus(userId: string, date: string, status: TaskStatus): Promise<Task[]>;
    abstract getTasksByDate(userId: string, date: string): Promise<Task[]>;
    abstract countByDateAndStatus(userId: string, date: string, status: TaskStatus): Promise<number>;
    abstract countByDate(userId: string, date: string): Promise<DateCounts>;
    abstract getTrendByDateRange(userId: string, fromDate: string, toDate: string): Promise<DateTrendRow[]>;

    abstract getCompletionByDomain(userId: string, from?: string, to?: string): Promise<DomainStat[]>;
    abstract getCarryOverStats(userId: string, fromDate: string, toDate: string): Promise<CarryOverStats>;
}

export type TaskFilters = {
    scheduledDate?: string;
    status?: TaskStatus;
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

export type DateCounts = {
    pending: number;
    done: number;
    discarded: number;
    total: number;
};

export type DateTrendRow = {
    date: string;
    total: number;
    completed: number;
    pending: number;
    discarded: number;
    carriedOver: number;
};
