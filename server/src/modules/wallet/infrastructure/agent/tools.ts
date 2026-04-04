import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { createAccountTools } from './tools/account-tools';
import { createExchangeRateTools } from './tools/exchange-rate-tools';
import { createInvestmentTools } from './tools/investment-tools';
import { createSavingsTools } from './tools/savings-tools';
import { createTransactionTools } from './tools/transaction-tools';
import { createStatsTools } from './tools/stats-tools';
import { AuthContextStorage } from '../../../common/auth/AuthContextStorage';

export class WalletTools {
    static createWalletTools(services: ServiceProvider, authContext: AuthContextStorage) {
        return [
            ...createAccountTools(services, authContext),
            ...createTransactionTools(services, authContext),
            ...createStatsTools(services, authContext),
            ...createSavingsTools(services, authContext),
            ...createInvestmentTools(services, authContext),
            ...createExchangeRateTools(services),
        ];
    }
}
