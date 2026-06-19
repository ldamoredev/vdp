import { CQBus } from '@nbottarini/cqbus';
import { createAccountTools } from './tools/account-tools';
import { createExchangeRateTools } from './tools/exchange-rate-tools';
import { createInvestmentTools } from './tools/investment-tools';
import { createSavingsTools } from './tools/savings-tools';
import { createTransactionTools } from './tools/transaction-tools';
import { createStatsTools } from './tools/stats-tools';
import { createWalletIntelligenceTools } from './tools/intelligence-tools';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';

export class WalletTools {
    static createWalletTools(bus: CQBus, authContext: AuthContextStorage) {
        return [
            ...createAccountTools(bus, authContext),
            ...createTransactionTools(bus, authContext),
            ...createStatsTools(bus, authContext),
            ...createWalletIntelligenceTools(bus, authContext),
            ...createSavingsTools(bus, authContext),
            ...createInvestmentTools(bus, authContext),
            ...createExchangeRateTools(bus, authContext),
        ];
    }
}
