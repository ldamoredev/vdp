import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CreateTaskData, TaskRepository } from '../domain/TaskRepository';
import { CreateTask, CreateTaskResult } from '../services/CreateTask';
import { EmbedTask } from '../services/EmbedTask';
import { FindSimilarTasks } from '../services/FindSimilarTasks';

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
        return new CreateTask(this.tasks, this.embedTask, this.findSimilarTasks)
            .execute(userId, command.input, command.checkDuplicates);
    }
}
