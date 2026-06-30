import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import {
    DailyReviewBriefSurface,
    DailyReviewStateRecord,
    DailyReviewStateRepository,
} from '../domain/DailyReviewStateRepository';

export class MarkDailyReviewBriefRequestedCommand extends Command<DailyReviewStateRecord> {
    constructor(
        readonly date: string,
        readonly surface: DailyReviewBriefSurface,
    ) {
        super();
    }
}

export class MarkDailyReviewBriefRequestedCommandHandler
    implements RequestHandler<MarkDailyReviewBriefRequestedCommand, DailyReviewStateRecord>
{
    constructor(private readonly repository: DailyReviewStateRepository) {}

    async handle(command: MarkDailyReviewBriefRequestedCommand, identity: Identity): Promise<DailyReviewStateRecord> {
        const { userId } = requireUserIdentity(identity);
        return this.repository.markBriefRequested(userId, command.date, command.surface);
    }
}
