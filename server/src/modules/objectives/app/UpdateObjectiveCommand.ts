import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Objective } from '../domain/Objective';
import { ObjectiveRepository, UpdateObjectiveData } from '../domain/ObjectiveRepository';

export class UpdateObjectiveCommand extends Command<Objective | null> {
    constructor(
        readonly id: string,
        readonly input: UpdateObjectiveData,
    ) {
        super();
    }
}

export class UpdateObjectiveCommandHandler implements RequestHandler<UpdateObjectiveCommand, Objective | null> {
    constructor(private readonly objectives: ObjectiveRepository) {}

    async handle(command: UpdateObjectiveCommand, identity: Identity): Promise<Objective | null> {
        const { userId } = requireUserIdentity(identity);
        const objective = await this.objectives.getObjective(userId, command.id);
        if (!objective) return null;
        objective.update(command.input);
        return this.objectives.save(userId, objective);
    }
}
