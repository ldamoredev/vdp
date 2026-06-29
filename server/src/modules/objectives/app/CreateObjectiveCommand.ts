import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Objective } from '../domain/Objective';
import { CreateObjectiveData, ObjectiveRepository } from '../domain/ObjectiveRepository';

export class CreateObjectiveCommand extends Command<Objective> {
    constructor(readonly input: CreateObjectiveData) {
        super();
    }
}

export class CreateObjectiveCommandHandler implements RequestHandler<CreateObjectiveCommand, Objective> {
    constructor(private readonly objectives: ObjectiveRepository) {}

    async handle(command: CreateObjectiveCommand, identity: Identity): Promise<Objective> {
        const { userId } = requireUserIdentity(identity);
        return this.objectives.createObjective(userId, command.input);
    }
}
