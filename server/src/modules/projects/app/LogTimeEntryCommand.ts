import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { TaskRepository } from '../../tasks/domain/TaskRepository';
import { Project } from '../domain/Project';
import { ProjectRepository } from '../domain/ProjectRepository';
import { TimeEntry } from '../domain/TimeEntry';
import { TimeEntryRepository } from '../domain/TimeEntryRepository';

export type LogTimeEntryInput = {
    readonly projectId: string;
    readonly taskId?: string | null;
    readonly date: string;
    readonly minutes: number;
    readonly note?: string | null;
};

export class LogTimeEntryCommand extends Command<TimeEntry> {
    constructor(readonly input: LogTimeEntryInput) {
        super();
    }
}

export class LogTimeEntryCommandHandler implements RequestHandler<LogTimeEntryCommand, TimeEntry> {
    constructor(
        private readonly projects: ProjectRepository,
        private readonly entries: TimeEntryRepository,
        private readonly tasks: TaskRepository,
    ) {}

    async handle(command: LogTimeEntryCommand, identity: Identity): Promise<TimeEntry> {
        const { userId } = requireUserIdentity(identity);
        const project = await assertProjectAndTask(
            userId,
            command.input.projectId,
            command.input.taskId ?? null,
            this.projects,
            this.tasks,
        );
        if (!project.isActive()) throw new DomainHttpError('Cannot log time on an archived project');
        return this.entries.createTimeEntry(userId, command.input);
    }
}

export async function assertProjectAndTask(
    userId: string,
    projectId: string,
    taskId: string | null,
    projects: ProjectRepository,
    tasks: TaskRepository,
): Promise<Project> {
    const project = await projects.getProject(userId, projectId);
    if (!project) throw new NotFoundHttpError('Project not found');
    if (!taskId) return project;
    const task = await tasks.getTask(userId, taskId);
    if (!task) throw new NotFoundHttpError('Task not found');
    if (task.projectId !== projectId) throw new DomainHttpError('Task does not belong to project');
    return project;
}
