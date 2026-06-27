import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { ProjectRepository } from '../../projects/domain/ProjectRepository';
import { Task } from '../domain/Task';
import { CreateTaskData, TaskRepository } from '../domain/TaskRepository';
import { EmbedTask } from '../services/EmbedTask';
import { FindSimilarTasks, SimilarTaskResult } from '../services/FindSimilarTasks';

export type CreateTaskResult = {
    task: Task;
    similarTasks?: SimilarTaskResult[];
};

export class CreateTaskCommand extends Command<CreateTaskResult> {
    constructor(
        readonly input: CreateTaskData,
        readonly checkDuplicates = false,
    ) {
        super();
    }
}

export class CreateTaskCommandHandler implements RequestHandler<CreateTaskCommand, CreateTaskResult> {
    constructor(
        private readonly tasks: TaskRepository,
        private readonly projects: ProjectRepository,
        private readonly embedTask: EmbedTask,
        private readonly findSimilarTasks: FindSimilarTasks,
    ) {}

    async handle(command: CreateTaskCommand, identity: Identity): Promise<CreateTaskResult> {
        const { userId } = requireUserIdentity(identity);
        let similarTasks: SimilarTaskResult[] | undefined;

        if (command.checkDuplicates) {
            similarTasks = await this.findSimilarTasks.execute(userId, command.input.title, 3, 0.6);
        }

        const input = await this.inputWithValidatedProject(userId, command.input);
        const task = await this.tasks.createTask(userId, input);
        this.embedTask.executeInBackground(userId, task.id);

        return { task, similarTasks };
    }

    private async inputWithValidatedProject(userId: string, input: CreateTaskData): Promise<CreateTaskData> {
        if (!input.projectId) {
            return input.boardStatus === undefined ? input : { ...input, boardStatus: 'backlog' };
        }

        const project = await this.projects.getProject(userId, input.projectId);
        if (!project) throw new NotFoundHttpError('Project not found');

        return {
            ...input,
            projectId: project.id,
            boardStatus: input.boardStatus ?? 'backlog',
        };
    }
}
