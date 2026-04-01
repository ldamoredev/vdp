import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { createAccountTools } from './tools/account-tools';
import { createExchangeRateTools } from './tools/exchange-rate-tools';
import { createInvestmentTools } from './tools/investment-tools';
import { createSavingsTools } from './tools/savings-tools';
import { createTransactionTools } from './tools/transaction-tools';
import { createStatsTools } from './tools/stats-tools';

export class WalletTools {
    static createWalletTools(services: ServiceProvider) {
        return [
            ...createAccountTools(services),
            ...createTransactionTools(services),
            ...createStatsTools(services),
            ...createSavingsTools(services),
            ...createInvestmentTools(services),
            ...createExchangeRateTools(services),
        ];
    }
}
