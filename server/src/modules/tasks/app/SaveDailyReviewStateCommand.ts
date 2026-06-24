import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DailyReviewStateRecord, DailyReviewStateRepository } from '../domain/DailyReviewStateRepository';

export class SaveDailyReviewStateCommand extends Command<DailyReviewStateRecord> {
    constructor(readonly state: DailyReviewStateRecord) {
        super();
    }
}

export class SaveDailyReviewStateCommandHandler
    implements RequestHandler<SaveDailyReviewStateCommand, DailyReviewStateRecord>
{
    constructor(private readonly repository: DailyReviewStateRepository) {}

    async handle(command: SaveDailyReviewStateCommand, identity: Identity): Promise<DailyReviewStateRecord> {
        const { userId } = requireUserIdentity(identity);
        return this.repository.save(userId, command.state);
    }
}
