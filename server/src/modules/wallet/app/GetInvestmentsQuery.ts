import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Investment } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';
import { GetInvestments } from '../services/GetInvestments';

export class GetInvestmentsQuery extends Query<Investment[]> {}

export class GetInvestmentsQueryHandler implements RequestHandler<GetInvestmentsQuery, Investment[]> {
    constructor(private readonly investments: InvestmentRepository) {}

    async handle(_query: GetInvestmentsQuery, identity: Identity): Promise<Investment[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetInvestments(this.investments).execute(userId);
    }
}
