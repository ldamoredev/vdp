import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { CarryOverRate, GetCarryOverRate } from '../services/GetCarryOverRate';

export class GetCarryOverRateQuery extends Query<CarryOverRate> {
    constructor(readonly days?: number) {
        super();
    }
}

export class GetCarryOverRateQueryHandler implements RequestHandler<GetCarryOverRateQuery, CarryOverRate> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(query: GetCarryOverRateQuery, identity: Identity): Promise<CarryOverRate> {
        const { userId } = requireUserIdentity(identity);
        return new GetCarryOverRate(this.tasks).execute(userId, query.days);
    }
}
