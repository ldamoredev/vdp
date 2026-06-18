import { AgentRepository } from '../common/base/agents/AgentRepository';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { ContributeSavingsCommand, ContributeSavingsCommandHandler } from './app/ContributeSavingsCommand';
import { CreateAccountCommand, CreateAccountCommandHandler } from './app/CreateAccountCommand';
import { CreateCategoryCommand, CreateCategoryCommandHandler } from './app/CreateCategoryCommand';
import { CreateExchangeRateCommand, CreateExchangeRateCommandHandler } from './app/CreateExchangeRateCommand';
import { CreateInvestmentCommand, CreateInvestmentCommandHandler } from './app/CreateInvestmentCommand';
import { CreateSavingsGoalCommand, CreateSavingsGoalCommandHandler } from './app/CreateSavingsGoalCommand';
import { CreateTransactionCommand, CreateTransactionCommandHandler } from './app/CreateTransactionCommand';
import { DeleteAccountCommand, DeleteAccountCommandHandler } from './app/DeleteAccountCommand';
import { DeleteTransactionCommand, DeleteTransactionCommandHandler } from './app/DeleteTransactionCommand';
import { GetAccountsQuery, GetAccountsQueryHandler } from './app/GetAccountsQuery';
import { GetCategoriesQuery, GetCategoriesQueryHandler } from './app/GetCategoriesQuery';
import { GetCategoryTrendsQuery, GetCategoryTrendsQueryHandler } from './app/GetCategoryTrendsQuery';
import { GetExchangeRatesQuery, GetExchangeRatesQueryHandler } from './app/GetExchangeRatesQuery';
import { GetInvestmentsQuery, GetInvestmentsQueryHandler } from './app/GetInvestmentsQuery';
import { GetMonthlyTrendQuery, GetMonthlyTrendQueryHandler } from './app/GetMonthlyTrendQuery';
import { GetSavingsGoalsQuery, GetSavingsGoalsQueryHandler } from './app/GetSavingsGoalsQuery';
import { GetSpendingAnomaliesQuery, GetSpendingAnomaliesQueryHandler } from './app/GetSpendingAnomaliesQuery';
import { GetSpendingByCategoryQuery, GetSpendingByCategoryQueryHandler } from './app/GetSpendingByCategoryQuery';
import { GetSpendingSummaryQuery, GetSpendingSummaryQueryHandler } from './app/GetSpendingSummaryQuery';
import { GetTransactionsQuery, GetTransactionsQueryHandler } from './app/GetTransactionsQuery';
import { GetWalletBalanceQuery, GetWalletBalanceQueryHandler } from './app/GetWalletBalanceQuery';
import { GetWalletSnapshotQuery, GetWalletSnapshotQueryHandler } from './app/GetWalletSnapshotQuery';
import { UpdateAccountCommand, UpdateAccountCommandHandler } from './app/UpdateAccountCommand';
import { UpdateInvestmentCommand, UpdateInvestmentCommandHandler } from './app/UpdateInvestmentCommand';
import { UpdateSavingsGoalCommand, UpdateSavingsGoalCommandHandler } from './app/UpdateSavingsGoalCommand';
import { UpdateTransactionCommand, UpdateTransactionCommandHandler } from './app/UpdateTransactionCommand';
import { WalletController } from './infrastructure/routes/WalletController';
import { WalletAgentController } from './infrastructure/routes/WalletAgentController';
import { WalletAgent } from './infrastructure/agent/WalletAgent';
import { AccountRepository } from './domain/AccountRepository';
import { TransactionRepository } from './domain/TransactionRepository';
import { CategoryRepository } from './domain/CategoryRepository';
import { SavingsGoalRepository } from './domain/SavingsGoalRepository';
import { InvestmentRepository } from './domain/InvestmentRepository';
import { ExchangeRateRepository } from './domain/ExchangeRateRepository';

import { DetectSpendingSpike } from './services/DetectSpendingSpike';
import { WalletEventHandlers } from './services/WalletEventHandlers';
import { WalletInsightsStore } from './services/WalletInsightsStore';

export interface WalletModuleRuntimeDeps extends ModuleContext {
    insightsStore: WalletInsightsStore;
}

export class WalletModuleRuntime {
    constructor(private deps: WalletModuleRuntimeDeps) {}

    registerServices(): void {
    }

    registerHandlers(): void {
        this.deps.bus.registerHandler(GetAccountsQuery, () =>
            new GetAccountsQueryHandler(this.accountRepository(), this.transactionRepository()),
        );
        this.deps.bus.registerHandler(CreateAccountCommand, () =>
            new CreateAccountCommandHandler(this.accountRepository()),
        );
        this.deps.bus.registerHandler(UpdateAccountCommand, () =>
            new UpdateAccountCommandHandler(this.accountRepository()),
        );
        this.deps.bus.registerHandler(DeleteAccountCommand, () =>
            new DeleteAccountCommandHandler(this.accountRepository()),
        );
        this.deps.bus.registerHandler(GetCategoriesQuery, () =>
            new GetCategoriesQueryHandler(this.categoryRepository()),
        );
        this.deps.bus.registerHandler(CreateCategoryCommand, () =>
            new CreateCategoryCommandHandler(this.categoryRepository()),
        );
        this.deps.bus.registerHandler(GetTransactionsQuery, () =>
            new GetTransactionsQueryHandler(this.transactionRepository()),
        );
        this.deps.bus.registerHandler(CreateTransactionCommand, () =>
            new CreateTransactionCommandHandler(
                this.transactionRepository(),
                this.deps.eventBus,
                this.accountRepository(),
                this.categoryRepository(),
            ),
        );
        this.deps.bus.registerHandler(UpdateTransactionCommand, () =>
            new UpdateTransactionCommandHandler(
                this.transactionRepository(),
                this.accountRepository(),
                this.categoryRepository(),
            ),
        );
        this.deps.bus.registerHandler(DeleteTransactionCommand, () =>
            new DeleteTransactionCommandHandler(this.transactionRepository()),
        );
        this.deps.bus.registerHandler(GetSpendingSummaryQuery, () =>
            new GetSpendingSummaryQueryHandler(this.transactionRepository(), this.categoryRepository()),
        );
        this.deps.bus.registerHandler(GetSpendingByCategoryQuery, () =>
            new GetSpendingByCategoryQueryHandler(this.transactionRepository(), this.categoryRepository()),
        );
        this.deps.bus.registerHandler(GetMonthlyTrendQuery, () =>
            new GetMonthlyTrendQueryHandler(this.transactionRepository(), this.categoryRepository()),
        );
        this.deps.bus.registerHandler(GetSavingsGoalsQuery, () =>
            new GetSavingsGoalsQueryHandler(this.savingsGoalRepository()),
        );
        this.deps.bus.registerHandler(CreateSavingsGoalCommand, () =>
            new CreateSavingsGoalCommandHandler(this.savingsGoalRepository()),
        );
        this.deps.bus.registerHandler(UpdateSavingsGoalCommand, () =>
            new UpdateSavingsGoalCommandHandler(this.savingsGoalRepository()),
        );
        this.deps.bus.registerHandler(ContributeSavingsCommand, () =>
            new ContributeSavingsCommandHandler(this.savingsGoalRepository(), this.transactionRepository()),
        );
        this.deps.bus.registerHandler(GetInvestmentsQuery, () =>
            new GetInvestmentsQueryHandler(this.investmentRepository()),
        );
        this.deps.bus.registerHandler(CreateInvestmentCommand, () =>
            new CreateInvestmentCommandHandler(this.investmentRepository(), this.accountRepository()),
        );
        this.deps.bus.registerHandler(UpdateInvestmentCommand, () =>
            new UpdateInvestmentCommandHandler(this.investmentRepository(), this.accountRepository()),
        );
        this.deps.bus.registerHandler(GetExchangeRatesQuery, () =>
            new GetExchangeRatesQueryHandler(this.exchangeRateRepository()),
        );
        this.deps.bus.registerHandler(CreateExchangeRateCommand, () =>
            new CreateExchangeRateCommandHandler(this.exchangeRateRepository()),
        );
        this.deps.bus.registerHandler(GetWalletBalanceQuery, () =>
            new GetWalletBalanceQueryHandler(this.accountRepository(), this.transactionRepository()),
        );
        this.deps.bus.registerHandler(GetSpendingAnomaliesQuery, () =>
            new GetSpendingAnomaliesQueryHandler(this.transactionRepository(), this.categoryRepository()),
        );
        this.deps.bus.registerHandler(GetCategoryTrendsQuery, () =>
            new GetCategoryTrendsQueryHandler(this.transactionRepository(), this.categoryRepository()),
        );
        this.deps.bus.registerHandler(GetWalletSnapshotQuery, () =>
            new GetWalletSnapshotQueryHandler(this.transactionRepository(), this.categoryRepository()),
        );
    }

    registerEventHandlers(): void {
        const spikeDetector = new DetectSpendingSpike(this.transactionRepository(), this.deps.eventBus, this.deps.logger);
        const handlers = new WalletEventHandlers(
            this.deps.eventBus,
            spikeDetector,
            this.deps.insightsStore,
            this.deps.logger,
        );
        handlers.subscribe();
        this.subscribeInsightsToSSE();
    }

    registerAgent(): void {
        this.deps.agentRegistry.register(
            new WalletAgent(
                this.deps.eventBus,
                this.deps.services,
                this.deps.bus,
                this.deps.repositories,
                this.deps.llmTraceService,
                this.deps.traceService,
                this.deps.agentProvider,
                this.deps.logger,
                this.deps.authContextStorage
            )
        );
    }

    createControllers() {
        return [
            new WalletController(this.deps.bus),
            new WalletAgentController(this.deps.agentRegistry, this.agentRepository(), this.deps.authContextStorage),
        ];
    }

    /**
     * Called once at server start. A rehydration failure must never block
     * boot: insights fall back to an empty store, as before persistence.
     */
    async rehydrateInsights(): Promise<void> {
        try {
            await this.deps.insightsStore.hydrate();
        } catch (err: unknown) {
            this.deps.logger.warn('wallet insight rehydration failed', {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    private subscribeInsightsToSSE(): void {
        this.deps.insightsStore.onInsight((insight, userId) => {
            if (this.deps.sseBroadcaster.hasClients(userId)) {
                this.deps.insightsStore.markInsightRead(userId, insight.id);
                insight.read = true;
            }

            this.deps.sseBroadcaster.broadcastToUser(userId, 'wallet-insight', insight);
        });
    }

    private accountRepository(): AccountRepository {
        return this.deps.repositories.get(AccountRepository);
    }

    private transactionRepository(): TransactionRepository {
        return this.deps.repositories.get(TransactionRepository);
    }

    private categoryRepository(): CategoryRepository {
        return this.deps.repositories.get(CategoryRepository);
    }

    private savingsGoalRepository(): SavingsGoalRepository {
        return this.deps.repositories.get(SavingsGoalRepository);
    }

    private investmentRepository(): InvestmentRepository {
        return this.deps.repositories.get(InvestmentRepository);
    }

    private exchangeRateRepository(): ExchangeRateRepository {
        return this.deps.repositories.get(ExchangeRateRepository);
    }

    private agentRepository(): AgentRepository {
        return this.deps.repositories.get(AgentRepository);
    }
}
