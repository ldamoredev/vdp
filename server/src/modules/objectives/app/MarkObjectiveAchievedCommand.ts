import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { Objective } from '../domain/Objective';
import { ObjectiveRepository } from '../domain/ObjectiveRepository';

export class MarkObjectiveAchievedCommand extends Command<Objective> {
    constructor(readonly id: string) {
        super();
    }
}

export class MarkObjectiveAchievedCommandHandler implements RequestHandler<MarkObjectiveAchievedCommand, Objective> {
    constructor(private readonly objectives: ObjectiveRepository) {}

    async handle(command: MarkObjectiveAchievedCommand, identity: Identity): Promise<Objective> {
        const { userId } = requireUserIdentity(identity);
        const objective = await this.objectives.getObjective(userId, command.id);
        if (!objective) throw new NotFoundHttpError('Objective not found');
        objective.markAchieved();
        return this.objectives.save(userId, objective);
    }
}
