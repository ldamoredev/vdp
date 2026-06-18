import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { AccountRepository } from '../domain/AccountRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import { AccountWithBalance, GetAccounts } from '../services/GetAccounts';

export type WalletBalance = {
    readonly accounts: AccountWithBalance[];
    readonly totals: {
        readonly ARS: string;
        readonly USD: string;
    };
};

export class GetWalletBalanceQuery extends Query<AccountWithBalance | WalletBalance | { error: string }> {
    constructor(readonly accountId?: string) {
        super();
    }
}

export class GetWalletBalanceQueryHandler
implements RequestHandler<GetWalletBalanceQuery, AccountWithBalance | WalletBalance | { error: string }> {
    constructor(
        private readonly accounts: AccountRepository,
        private readonly transactions: TransactionRepository,
    ) {}

    async handle(query: GetWalletBalanceQuery, identity: Identity): Promise<AccountWithBalance | WalletBalance | { error: string }> {
        const { userId } = requireUserIdentity(identity);
        const accounts = await new GetAccounts(this.accounts, this.transactions).execute(userId);
        if (query.accountId) {
            return accounts.find((account) => account.id === query.accountId) ?? { error: 'Account not found' };
        }

        const totalARS = accounts
            .filter((account) => account.currency === 'ARS')
            .reduce((sum, account) => sum + Number.parseFloat(account.currentBalance), 0);
        const totalUSD = accounts
            .filter((account) => account.currency === 'USD')
            .reduce((sum, account) => sum + Number.parseFloat(account.currentBalance), 0);

        return {
            accounts,
            totals: {
                ARS: totalARS.toFixed(2),
                USD: totalUSD.toFixed(2),
            },
        };
    }
}
