import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Objective } from '../domain/Objective';
import { ObjectiveRepository } from '../domain/ObjectiveRepository';

export class ArchiveObjectiveCommand extends Command<Objective | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class ArchiveObjectiveCommandHandler implements RequestHandler<ArchiveObjectiveCommand, Objective | null> {
    constructor(private readonly objectives: ObjectiveRepository) {}

    async handle(command: ArchiveObjectiveCommand, identity: Identity): Promise<Objective | null> {
        const { userId } = requireUserIdentity(identity);
        const objective = await this.objectives.getObjective(userId, command.id);
        if (!objective) return null;
        objective.archive();
        return this.objectives.save(userId, objective);
    }
}
