import { Task, TaskStatus } from './Task';

export abstract class TaskRepository {
    abstract getTask(id: string): Promise<Task | null>;
    abstract listTasks(filters: TaskFilters): Promise<PagedTasks>;
    abstract createTask(data: CreateTaskData): Promise<Task>;
    abstract updateTask(id: string, data: UpdateTaskData): Promise<Task | null>;
    abstract deleteTask(id: string): Promise<Task | null>;

    abstract save(task: Task): Promise<Task>;

    abstract getTasksByDateAndStatus(date: string, status: TaskStatus): Promise<Task[]>;
    abstract getTasksByDate(date: string): Promise<Task[]>;
    abstract countByDateAndStatus(date: string, status: TaskStatus): Promise<number>;

    abstract getCompletionByDomain(from?: string, to?: string): Promise<DomainStat[]>;
    abstract getCarryOverStats(fromDate: string, toDate: string): Promise<CarryOverStats>;
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
