import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { CounterSnapshot } from '../domain/Counter';
import { CounterRepository } from '../domain/CounterRepository';

export class ArchiveCounterCommand extends Command<CounterSnapshot> {
    constructor(readonly counterId: string) {
        super();
    }
}

export class ArchiveCounterCommandHandler implements RequestHandler<ArchiveCounterCommand, CounterSnapshot> {
    constructor(private readonly counters: CounterRepository) {}

    async handle(command: ArchiveCounterCommand, identity: Identity): Promise<CounterSnapshot> {
        const { userId } = requireUserIdentity(identity);
        const counter = await this.counters.getCounter(userId, command.counterId);
        if (!counter) throw new NotFoundHttpError('Counter not found');
        if (counter.isArchived()) return counter.toSnapshot();

        counter.archive();
        await this.counters.save(userId, counter);
        return counter.toSnapshot();
    }
}
