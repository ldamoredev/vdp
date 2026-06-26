import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TimeEntryRepository } from '../domain/TimeEntryRepository';

export class DeleteTimeEntryCommand extends Command<boolean> {
    constructor(readonly id: string) {
        super();
    }
}

export class DeleteTimeEntryCommandHandler implements RequestHandler<DeleteTimeEntryCommand, boolean> {
    constructor(private readonly entries: TimeEntryRepository) {}

    async handle(command: DeleteTimeEntryCommand, identity: Identity): Promise<boolean> {
        const { userId } = requireUserIdentity(identity);
        return this.entries.deleteTimeEntry(userId, command.id);
    }
}
