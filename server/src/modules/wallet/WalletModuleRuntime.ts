import { AgentRepository } from '../common/base/agents/AgentRepository';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { WalletController } from './infrastructure/routes/WalletController';
import { WalletAgentController } from './infrastructure/routes/WalletAgentController';
import { WalletAgent } from './infrastructure/agent/WalletAgent';
import { AccountRepository } from './domain/AccountRepository';
import { TransactionRepository } from './domain/TransactionRepository';
import { CategoryRepository } from './domain/CategoryRepository';
import { SavingsGoalRepository } from './domain/SavingsGoalRepository';
import { InvestmentRepository } from './domain/InvestmentRepository';
import { ExchangeRateRepository } from './domain/ExchangeRateRepository';

import { GetAccounts } from './services/GetAccounts';
import { CreateAccount } from './services/CreateAccount';
import { UpdateAccount } from './services/UpdateAccount';
import { DeleteAccount } from './services/DeleteAccount';
import { GetTransactions } from './services/GetTransactions';
import { CreateTransaction } from './services/CreateTransaction';
import { UpdateTransaction } from './services/UpdateTransaction';
import { DeleteTransaction } from './services/DeleteTransaction';
import { GetCategories } from './services/GetCategories';
import { CreateCategory } from './services/CreateCategory';
import { GetSpendingStats } from './services/GetSpendingStats';
import { GetSavingsGoals } from './services/GetSavingsGoals';
import { CreateSavingsGoal } from './services/CreateSavingsGoal';
import { UpdateSavingsGoal } from './services/UpdateSavingsGoal';
import { ContributeSavings } from './services/ContributeSavings';
import { GetInvestments } from './services/GetInvestments';
import { CreateInvestment } from './services/CreateInvestment';
import { UpdateInvestment } from './services/UpdateInvestment';
import { GetExchangeRates } from './services/GetExchangeRates';
import { CreateExchangeRate } from './services/CreateExchangeRate';
import { DetectSpendingSpike } from './services/DetectSpendingSpike';
import { WalletEventHandlers } from './services/WalletEventHandlers';

export class WalletModuleRuntime {
    constructor(private deps: ModuleContext) {}

    registerServices(): void {
        this.registerAccountServices();
        this.registerTransactionServices();
        this.registerCategoryServices();
        this.registerStatsServices();
        this.registerSavingsServices();
        this.registerInvestmentServices();
        this.registerExchangeRateServices();
    }

    registerEventHandlers(): void {
        const spikeDetector = new DetectSpendingSpike(this.transactionRepository(), this.deps.eventBus, this.deps.logger);
        const handlers = new WalletEventHandlers(this.deps.eventBus, spikeDetector, this.deps.logger,);
        handlers.subscribe();
    }

    registerAgent(): void {
        this.deps.agentRegistry.register(
            new WalletAgent(
                this.deps.eventBus,
                this.deps.services,
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
            new WalletController(this.deps.services),
            new WalletAgentController(this.deps.agentRegistry, this.agentRepository()),
        ];
    }

    private registerAccountServices(): void {
        this.deps.services.register(
            GetAccounts,
            () => new GetAccounts(this.accountRepository(), this.transactionRepository()),
        );
        this.deps.services.register(
            CreateAccount,
            () => new CreateAccount(this.accountRepository()),
        );
        this.deps.services.register(
            UpdateAccount,
            () => new UpdateAccount(this.accountRepository()),
        );
        this.deps.services.register(
            DeleteAccount,
            () => new DeleteAccount(this.accountRepository()),
        );
    }

    private registerTransactionServices(): void {
        this.deps.services.register(
            GetTransactions,
            () => new GetTransactions(this.transactionRepository()),
        );
        this.deps.services.register(
            CreateTransaction,
            () => new CreateTransaction(this.transactionRepository(), this.deps.eventBus),
        );
        this.deps.services.register(
            UpdateTransaction,
            () => new UpdateTransaction(this.transactionRepository()),
        );
        this.deps.services.register(
            DeleteTransaction,
            () => new DeleteTransaction(this.transactionRepository()),
        );
    }

    private registerCategoryServices(): void {
        this.deps.services.register(
            GetCategories,
            () => new GetCategories(this.categoryRepository()),
        );
        this.deps.services.register(
            CreateCategory,
            () => new CreateCategory(this.categoryRepository()),
        );
    }

    private registerStatsServices(): void {
        this.deps.services.register(
            GetSpendingStats,
            () => new GetSpendingStats(this.transactionRepository(), this.categoryRepository()),
        );
    }

    private registerSavingsServices(): void {
        this.deps.services.register(
            GetSavingsGoals,
            () => new GetSavingsGoals(this.savingsGoalRepository()),
        );
        this.deps.services.register(
            CreateSavingsGoal,
            () => new CreateSavingsGoal(this.savingsGoalRepository()),
        );
        this.deps.services.register(
            UpdateSavingsGoal,
            () => new UpdateSavingsGoal(this.savingsGoalRepository()),
        );
        this.deps.services.register(
            ContributeSavings,
            () => new ContributeSavings(this.savingsGoalRepository()),
        );
    }

    private registerInvestmentServices(): void {
        this.deps.services.register(
            GetInvestments,
            () => new GetInvestments(this.investmentRepository()),
        );
        this.deps.services.register(
            CreateInvestment,
            () => new CreateInvestment(this.investmentRepository()),
        );
        this.deps.services.register(
            UpdateInvestment,
            () => new UpdateInvestment(this.investmentRepository()),
        );
    }

    private registerExchangeRateServices(): void {
        this.deps.services.register(
            GetExchangeRates,
            () => new GetExchangeRates(this.exchangeRateRepository()),
        );
        this.deps.services.register(
            CreateExchangeRate,
            () => new CreateExchangeRate(this.exchangeRateRepository()),
        );
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
