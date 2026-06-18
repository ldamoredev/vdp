import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { AccountRepository } from '../domain/AccountRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { AccountWithBalance, GetAccounts } from '../services/GetAccounts';

export class GetAccountsQuery extends Query<AccountWithBalance[]> {}

export class GetAccountsQueryHandler implements RequestHandler<GetAccountsQuery, AccountWithBalance[]> {
    constructor(
        private readonly accounts: AccountRepository,
        private readonly transactions: TransactionRepository,
    ) {}

    async handle(_query: GetAccountsQuery, identity: Identity): Promise<AccountWithBalance[]> {
        const { userId } = requireUserIdentity(identity);
        return new GetAccounts(this.accounts, this.transactions).execute(userId);
    }
}
