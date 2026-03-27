import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { createAccountTools } from './tools/account-tools';
import { createTransactionTools } from './tools/transaction-tools';
import { createStatsTools } from './tools/stats-tools';

export class WalletTools {
    static createWalletTools(services: ServiceProvider) {
        return [
            ...createAccountTools(services),
            ...createTransactionTools(services),
            ...createStatsTools(services),
        ];
    }
}
