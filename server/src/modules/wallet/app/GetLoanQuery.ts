import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Loan } from '../domain/Loan';
import { LoanRepository } from '../domain/LoanRepository';

export class GetLoanQuery extends Query<Loan | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class GetLoanQueryHandler implements RequestHandler<GetLoanQuery, Loan | null> {
    constructor(private readonly loans: LoanRepository) {}

    async handle(query: GetLoanQuery, identity: Identity): Promise<Loan | null> {
        const { userId } = requireUserIdentity(identity);
        return this.loans.getLoan(userId, query.id);
    }
}
