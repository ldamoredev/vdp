import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CounterSnapshot } from '../domain/Counter';
import { CounterRepository } from '../domain/CounterRepository';
import { ArchiveCounter } from '../services/ArchiveCounter';

export class ArchiveCounterCommand extends Command<CounterSnapshot> {
    constructor(readonly counterId: string) {
        super();
    }
}

export class ArchiveCounterCommandHandler implements RequestHandler<ArchiveCounterCommand, CounterSnapshot> {
    constructor(private readonly counters: CounterRepository) {}

    async handle(command: ArchiveCounterCommand, identity: Identity): Promise<CounterSnapshot> {
        const { userId } = requireUserIdentity(identity);
        const counter = await new ArchiveCounter(this.counters).execute(userId, command.counterId);
        return counter.toSnapshot();
    }
}
