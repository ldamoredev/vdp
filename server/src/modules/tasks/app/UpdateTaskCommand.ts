import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Task } from '../domain/Task';
import { TaskRepository, UpdateTaskData } from '../domain/TaskRepository';
import { EmbedTask } from '../services/EmbedTask';
import { UpdateTask } from '../services/UpdateTask';

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
        private readonly embedTask: EmbedTask,
    ) {}

    async handle(command: UpdateTaskCommand, identity: Identity): Promise<Task | null> {
        const { userId } = requireUserIdentity(identity);
        return new UpdateTask(this.tasks, this.embedTask).execute(userId, command.id, command.input);
    }
}
