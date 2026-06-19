import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { TaskRepository } from '../domain/TaskRepository';
import { CarryOverRate, getCarryOverRate } from './task-stats';

export class GetCarryOverRateQuery extends Query<CarryOverRate> {
    constructor(readonly days?: number) {
        super();
    }
}

export class GetCarryOverRateQueryHandler implements RequestHandler<GetCarryOverRateQuery, CarryOverRate> {
    constructor(private readonly tasks: TaskRepository) {}

    async handle(query: GetCarryOverRateQuery, identity: Identity): Promise<CarryOverRate> {
        const { userId } = requireUserIdentity(identity);
        return getCarryOverRate(this.tasks, userId, query.days);
    }
}
