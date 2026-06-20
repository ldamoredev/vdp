import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { AccountRepository } from '../domain/AccountRepository';
import { ExchangeRateRepository } from '../domain/ExchangeRateRepository';
import { TransactionRepository } from '../domain/TransactionRepository';
import {
    CurrencyConversion,
    CurrencyConverter,
    DEFAULT_EXCHANGE_RATE_TYPE,
    DEFAULT_PRESENTATION_CURRENCY,
} from '../services/CurrencyConverter';
import { AccountWithBalance, getAccountsWithBalance } from './GetAccountsQuery';

export type WalletBalance = {
    readonly accounts: AccountWithBalance[];
    readonly currency: string;
    readonly totalBalance: string;
    readonly totals: {
        readonly ARS: string;
        readonly USD: string;
    };
    readonly conversion: CurrencyConversion;
};

export class GetWalletBalanceQuery extends Query<AccountWithBalance | WalletBalance | { error: string }> {
    constructor(
        readonly accountId?: string,
        readonly currency: string = DEFAULT_PRESENTATION_CURRENCY,
        readonly rateType: string = DEFAULT_EXCHANGE_RATE_TYPE,
    ) {
        super();
    }
}

export class GetWalletBalanceQueryHandler
implements RequestHandler<GetWalletBalanceQuery, AccountWithBalance | WalletBalance | { error: string }> {
    constructor(
        private readonly accounts: AccountRepository,
        private readonly transactions: TransactionRepository,
        private readonly exchangeRates: ExchangeRateRepository,
    ) {}

    async handle(query: GetWalletBalanceQuery, identity: Identity): Promise<AccountWithBalance | WalletBalance | { error: string }> {
        const { userId } = requireUserIdentity(identity);
        const accounts = await getAccountsWithBalance(this.accounts, this.transactions, userId);
        if (query.accountId) {
            return accounts.find((account) => account.id === query.accountId) ?? { error: 'Account not found' };
        }

        const totalARS = accounts
            .filter((account) => account.currency === 'ARS')
            .reduce((sum, account) => sum + Number.parseFloat(account.currentBalance), 0);
        const totalUSD = accounts
            .filter((account) => account.currency === 'USD')
            .reduce((sum, account) => sum + Number.parseFloat(account.currentBalance), 0);
        const converter = await this.createConverter(query.currency, query.rateType);
        const totalBalance = accounts.reduce(
            (sum, account) =>
                sum + converter.convert(Number.parseFloat(account.currentBalance), account.currency, query.currency),
            0,
        );

        return {
            accounts,
            currency: query.currency,
            totalBalance: totalBalance.toFixed(2),
            totals: {
                ARS: totalARS.toFixed(2),
                USD: totalUSD.toFixed(2),
            },
            conversion: {
                rateType: query.rateType,
                rates: converter.usedRates(),
            },
        };
    }

    private async createConverter(targetCurrency: string, rateType: string): Promise<CurrencyConverter> {
        const rates = await this.exchangeRates.findAll();
        return new CurrencyConverter(targetCurrency, rateType, rates);
    }
}
