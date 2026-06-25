import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { Task, type TaskBoardStatus } from '../../tasks/domain/Task';
import { TaskRepository } from '../../tasks/domain/TaskRepository';
import { ProjectRepository } from '../domain/ProjectRepository';

export type AssignTaskToProjectInput = {
    readonly boardStatus?: TaskBoardStatus | null;
};

export class AssignTaskToProjectCommand extends Command<Task | null> {
    constructor(
        readonly projectId: string,
        readonly taskId: string,
        readonly input: AssignTaskToProjectInput = {},
    ) {
        super();
    }
}

export class AssignTaskToProjectCommandHandler implements RequestHandler<AssignTaskToProjectCommand, Task | null> {
    constructor(
        private readonly projects: ProjectRepository,
        private readonly tasks: TaskRepository,
    ) {}

    async handle(command: AssignTaskToProjectCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        const project = await this.projects.getProject(userId, command.projectId);
        if (!project) throw new NotFoundHttpError('Project not found');
        const task = await this.tasks.getTask(userId, command.taskId);
        if (!task) return null;

        if (command.input.boardStatus === null) {
            task.unassignFromProject();
        } else {
            task.assignToProject(project.id, command.input.boardStatus ?? 'backlog');
        }

        return this.tasks.save(userId, task);
    }
}
