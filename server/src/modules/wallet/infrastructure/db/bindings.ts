import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { AccountRepository } from '../../domain/AccountRepository';
import { TransactionRepository } from '../../domain/TransactionRepository';
import { CategoryRepository } from '../../domain/CategoryRepository';
import { SavingsGoalRepository } from '../../domain/SavingsGoalRepository';
import { InvestmentRepository } from '../../domain/InvestmentRepository';
import { ExchangeRateRepository } from '../../domain/ExchangeRateRepository';
import { WalletInsightRepository } from '../../domain/WalletInsightRepository';
import { RecurringTransactionRepository } from '../../domain/RecurringTransactionRepository';
import { DrizzleAccountRepository } from './DrizzleAccountRepository';
import { DrizzleTransactionRepository } from './DrizzleTransactionRepository';
import { DrizzleCategoryRepository } from './DrizzleCategoryRepository';
import { DrizzleSavingsGoalRepository } from './DrizzleSavingsGoalRepository';
import { DrizzleInvestmentRepository } from './DrizzleInvestmentRepository';
import { DrizzleExchangeRateRepository } from './DrizzleExchangeRateRepository';
import { DrizzleWalletInsightRepository } from './DrizzleWalletInsightRepository';
import { DrizzleRecurringTransactionRepository } from './DrizzleRecurringTransactionRepository';

export function registerWalletRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(AccountRepository, () => new DrizzleAccountRepository(db));
    registry.register(TransactionRepository, () => new DrizzleTransactionRepository(db));
    registry.register(CategoryRepository, () => new DrizzleCategoryRepository(db));
    registry.register(SavingsGoalRepository, () => new DrizzleSavingsGoalRepository(db));
    registry.register(InvestmentRepository, () => new DrizzleInvestmentRepository(db));
    registry.register(ExchangeRateRepository, () => new DrizzleExchangeRateRepository(db));
    registry.register(WalletInsightRepository, () => new DrizzleWalletInsightRepository(db));
    registry.register(RecurringTransactionRepository, () => new DrizzleRecurringTransactionRepository(db));
}
