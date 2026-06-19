import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Account } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

export type AccountWithBalance = Account & { readonly currentBalance: string };

export class GetAccountsQuery extends Query<AccountWithBalance[]> {}

export class GetAccountsQueryHandler implements RequestHandler<GetAccountsQuery, AccountWithBalance[]> {
    constructor(
        private readonly accounts: AccountRepository,
        private readonly transactions: TransactionRepository,
    ) {}

    async handle(_query: GetAccountsQuery, identity: Identity): Promise<AccountWithBalance[]> {
        const { userId } = requireUserIdentity(identity);
        return getAccountsWithBalance(this.accounts, this.transactions, userId);
    }
}

export async function getAccountsWithBalance(
    accounts: AccountRepository,
    transactions: TransactionRepository,
    userId: string,
): Promise<AccountWithBalance[]> {
    const allAccounts = await accounts.findAll(userId);
    return Promise.all(
        allAccounts.map(async (account) => {
            const txSum = await transactions.sumByAccountId(userId, account.id);
            const currentBalance = (
                Number.parseFloat(account.initialBalance) + Number.parseFloat(txSum)
            ).toFixed(2);
            return { ...account, currentBalance };
        }),
    );
}
