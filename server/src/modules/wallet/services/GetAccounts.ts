import { Account } from '../domain/Account';
import { AccountRepository } from '../domain/AccountRepository';
import { TransactionRepository } from '../domain/TransactionRepository';

export type AccountWithBalance = Account & { readonly currentBalance: string };

export class GetAccounts {
    constructor(
        private readonly accounts: AccountRepository,
        private readonly transactions: TransactionRepository,
    ) {}

    async execute(userId: string): Promise<AccountWithBalance[]> {
        const allAccounts = await this.accounts.findAll(userId);
        return Promise.all(
            allAccounts.map(async (account) => {
                const txSum = await this.transactions.sumByAccountId(userId, account.id);
                const currentBalance = (
                    parseFloat(account.initialBalance) + parseFloat(txSum)
                ).toFixed(2);
                return { ...account, currentBalance };
            }),
        );
    }
}
