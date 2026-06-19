import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
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
        private readonly embedTask: EmbedTask,
        private readonly findSimilarTasks: FindSimilarTasks,
    ) {}

    async handle(command: CreateTaskCommand, identity: Identity): Promise<CreateTaskResult> {
        const { userId } = requireUserIdentity(identity);
        let similarTasks: SimilarTaskResult[] | undefined;

        if (command.checkDuplicates) {
            similarTasks = await this.findSimilarTasks.execute(userId, command.input.title, 3, 0.6);
        }

        const task = await this.tasks.createTask(userId, command.input);
        this.embedTask.executeInBackground(userId, task.id);

        return { task, similarTasks };
    }
}
