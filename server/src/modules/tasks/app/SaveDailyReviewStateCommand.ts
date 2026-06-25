import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainHttpError } from '../../common/http/errors';
import { DailyReviewStateRecord, DailyReviewStateRepository } from '../domain/DailyReviewStateRepository';
import { TaskRepository } from '../domain/TaskRepository';

export class SaveDailyReviewStateCommand extends Command<DailyReviewStateRecord> {
    constructor(readonly state: DailyReviewStateRecord) {
        super();
    }
}

export class SaveDailyReviewStateCommandHandler
    implements RequestHandler<SaveDailyReviewStateCommand, DailyReviewStateRecord>
{
    constructor(
        private readonly repository: DailyReviewStateRepository,
        private readonly tasks: TaskRepository,
    ) {}

    async handle(command: SaveDailyReviewStateCommand, identity: Identity): Promise<DailyReviewStateRecord> {
        const { userId } = requireUserIdentity(identity);
        if (command.state.focusTaskId) {
            const focusTask = await this.tasks.getTask(userId, command.state.focusTaskId);
            if (!focusTask) {
                throw new DomainHttpError('Focus task not found');
            }
        }
        return this.repository.save(userId, command.state);
    }
}
