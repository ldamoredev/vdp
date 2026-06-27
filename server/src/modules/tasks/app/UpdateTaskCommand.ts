import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainHttpError, NotFoundHttpError } from '../../common/http/errors';
import { ProjectRepository } from '../../projects/domain/ProjectRepository';
import { Task } from '../domain/Task';
import { TaskRepository, UpdateTaskData } from '../domain/TaskRepository';
import { EmbedTask } from '../services/EmbedTask';

export class UpdateTaskCommand extends Command<Task | null> {
    constructor(
        readonly id: string,
        readonly input: UpdateTaskData,
    ) {
        super();
    }
}

export class UpdateTaskCommandHandler implements RequestHandler<UpdateTaskCommand, Task | null> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly projects: ProjectRepository,
        private readonly embedTask: EmbedTask,
    ) {}

    async handle(command: UpdateTaskCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        const task = await this.tasks.getTask(userId, command.id);
        if (!task) return null;

        if (!task.isOpen()) {
            throw new DomainHttpError(`Cannot update a ${task.status} task`);
        }

        if (command.input.title !== undefined) task.title = command.input.title;
        if (command.input.description !== undefined) task.description = command.input.description;
        if (command.input.priority !== undefined) task.priority = command.input.priority;
        if (command.input.scheduledDate !== undefined) task.scheduledDate = command.input.scheduledDate;
        if (command.input.domain !== undefined) task.domain = command.input.domain;
        await this.applyProjectAssignment(userId, task, command.input);
        task.updatedAt = new Date();

        const saved = await this.tasks.save(userId, task);
        this.embedTask.executeInBackground(userId, command.id);
        return saved;
    }

    private async applyProjectAssignment(userId: string, task: Task, input: UpdateTaskData): Promise<void> {
        if (input.projectId === undefined) {
            if (input.boardStatus !== undefined) task.boardStatus = input.boardStatus;
            return;
        }

        if (input.projectId === null) {
            task.unassignFromProject();
            return;
        }

        const project = await this.projects.getProject(userId, input.projectId);
        if (!project) throw new NotFoundHttpError('Project not found');

        task.assignToProject(project.id, input.boardStatus ?? 'backlog');
    }
}
