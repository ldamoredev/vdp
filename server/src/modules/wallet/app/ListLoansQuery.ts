import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Loan } from '../domain/Loan';
import { LoanRepository } from '../domain/LoanRepository';

export class ListLoansQuery extends Query<Loan[]> {}

export class ListLoansQueryHandler implements RequestHandler<ListLoansQuery, Loan[]> {
    constructor(private readonly loans: LoanRepository) {}

    async handle(_query: ListLoansQuery, identity: Identity): Promise<Loan[]> {
        const { userId } = requireUserIdentity(identity);
        return this.loans.listLoans(userId);
    }
}
