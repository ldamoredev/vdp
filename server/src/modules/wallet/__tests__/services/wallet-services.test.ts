import { describe, it, expect, beforeEach } from 'vitest';
import { FakeAccountRepository } from '../../infrastructure/fake/FakeAccountRepository';
import { FakeTransactionRepository } from '../../infrastructure/fake/FakeTransactionRepository';
import { FakeCategoryRepository } from '../../infrastructure/fake/FakeCategoryRepository';
import { FakeSavingsGoalRepository } from '../../infrastructure/fake/FakeSavingsGoalRepository';
import { FakeInvestmentRepository } from '../../infrastructure/fake/FakeInvestmentRepository';
import { FakeExchangeRateRepository } from '../../infrastructure/fake/FakeExchangeRateRepository';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { GetAccounts } from '../../services/GetAccounts';
import { CreateAccount } from '../../services/CreateAccount';
import { UpdateAccount } from '../../services/UpdateAccount';
import { DeleteAccount } from '../../services/DeleteAccount';
import { GetTransactions } from '../../services/GetTransactions';
import { CreateTransaction } from '../../services/CreateTransaction';
import { UpdateTransaction } from '../../services/UpdateTransaction';
import { DeleteTransaction } from '../../services/DeleteTransaction';
import { GetCategories } from '../../services/GetCategories';
import { CreateCategory } from '../../services/CreateCategory';
import { GetSpendingStats } from '../../services/GetSpendingStats';
import { GetSavingsGoals } from '../../services/GetSavingsGoals';
import { CreateSavingsGoal } from '../../services/CreateSavingsGoal';
import { UpdateSavingsGoal } from '../../services/UpdateSavingsGoal';
import { ContributeSavings } from '../../services/ContributeSavings';
import { GetInvestments } from '../../services/GetInvestments';
import { CreateInvestment } from '../../services/CreateInvestment';
import { UpdateInvestment } from '../../services/UpdateInvestment';
import { GetExchangeRates } from '../../services/GetExchangeRates';
import { CreateExchangeRate } from '../../services/CreateExchangeRate';
import type { Account } from '../../domain/Account';
import type { Transaction } from '../../domain/Transaction';
import type { Category } from '../../domain/Category';
import type { SavingsGoal } from '../../domain/SavingsGoal';
import type { Investment } from '../../domain/Investment';
import type { ExchangeRate } from '../../domain/ExchangeRate';
import type { DomainEvent } from '../../../common/base/event-bus/DomainEvent';

// ─── Factories ──────────────────────────────────────

function createAccount(overrides: Partial<Account> = {}): Account {
    return {
        id: overrides.id ?? 'acc-1',
        name: overrides.name ?? 'Checking',
        currency: overrides.currency ?? 'ARS',
        type: overrides.type ?? 'bank',
        initialBalance: overrides.initialBalance ?? '1000',
        isActive: overrides.isActive ?? true,
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: overrides.id ?? 'tx-1',
        accountId: overrides.accountId ?? 'acc-1',
        categoryId: overrides.categoryId ?? null,
        type: overrides.type ?? 'expense',
        amount: overrides.amount ?? '100',
        currency: overrides.currency ?? 'ARS',
        description: overrides.description ?? 'Test transaction',
        date: overrides.date ?? '2026-03-15',
        transferToAccountId: overrides.transferToAccountId ?? null,
        tags: overrides.tags ?? [],
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

function createCategory(overrides: Partial<Category> = {}): Category {
    return {
        id: overrides.id ?? 'cat-1',
        name: overrides.name ?? 'Food',
        type: overrides.type ?? 'expense',
        icon: overrides.icon ?? null,
        parentId: overrides.parentId ?? null,
        createdAt: overrides.createdAt ?? new Date(),
    };
}

function createSavingsGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
    return {
        id: overrides.id ?? 'goal-1',
        name: overrides.name ?? 'Emergency fund',
        targetAmount: overrides.targetAmount ?? '1000',
        currentAmount: overrides.currentAmount ?? '250',
        currency: overrides.currency ?? 'ARS',
        deadline: overrides.deadline ?? null,
        isCompleted: overrides.isCompleted ?? false,
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

function createInvestment(overrides: Partial<Investment> = {}): Investment {
    return {
        id: overrides.id ?? 'inv-1',
        name: overrides.name ?? 'FCI Conservador',
        type: overrides.type ?? 'fci',
        accountId: overrides.accountId ?? null,
        currency: overrides.currency ?? 'ARS',
        investedAmount: overrides.investedAmount ?? '1000',
        currentValue: overrides.currentValue ?? '1050',
        startDate: overrides.startDate ?? '2026-03-01',
        endDate: overrides.endDate ?? null,
        rate: overrides.rate ?? null,
        notes: overrides.notes ?? null,
        isActive: overrides.isActive ?? true,
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

function createExchangeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
    return {
        id: overrides.id ?? 'fx-1',
        fromCurrency: overrides.fromCurrency ?? 'USD',
        toCurrency: overrides.toCurrency ?? 'ARS',
        rate: overrides.rate ?? '1100.00',
        type: overrides.type ?? 'blue',
        date: overrides.date ?? '2026-03-20',
        createdAt: overrides.createdAt ?? new Date(),
    };
}

// ─── Tests ──────────────────────────────────────────

describe('GetAccounts', () => {
    let accountRepo: FakeAccountRepository;
    let txRepo: FakeTransactionRepository;
    let service: GetAccounts;

    beforeEach(() => {
        accountRepo = new FakeAccountRepository();
        txRepo = new FakeTransactionRepository();
        service = new GetAccounts(accountRepo, txRepo);
    });

    it('returns empty array when no accounts', async () => {
        const result = await service.execute();
        expect(result).toHaveLength(0);
    });

    it('returns accounts with calculated balance', async () => {
        accountRepo.seed([createAccount({ id: 'acc-1', initialBalance: '1000' })]);
        txRepo.seed([
            createTransaction({ id: 'tx-1', accountId: 'acc-1', type: 'income', amount: '500' }),
            createTransaction({ id: 'tx-2', accountId: 'acc-1', type: 'expense', amount: '200' }),
        ]);

        const result = await service.execute();

        expect(result).toHaveLength(1);
        // 1000 + 500 - 200 = 1300
        expect(result[0].currentBalance).toBe('1300.00');
        expect(result[0].name).toBe('Checking');
    });
});

describe('CreateAccount', () => {
    let accountRepo: FakeAccountRepository;
    let service: CreateAccount;

    beforeEach(() => {
        accountRepo = new FakeAccountRepository();
        service = new CreateAccount(accountRepo);
    });

    it('creates account with valid data', async () => {
        const result = await service.execute({
            name: 'Savings',
            currency: 'USD',
            type: 'savings',
            initialBalance: '5000',
        });

        expect(result.name).toBe('Savings');
        expect(result.currency).toBe('USD');
        expect(result.type).toBe('savings');
        expect(result.initialBalance).toBe('5000');
        expect(result.id).toBeDefined();
        expect(accountRepo.size).toBe(1);
    });

    it('creates account with default initialBalance', async () => {
        const result = await service.execute({
            name: 'Empty',
            currency: 'ARS',
            type: 'cash',
        });

        expect(result.initialBalance).toBe('0');
    });
});

describe('UpdateAccount', () => {
    let accountRepo: FakeAccountRepository;
    let service: UpdateAccount;

    beforeEach(() => {
        accountRepo = new FakeAccountRepository();
        service = new UpdateAccount(accountRepo);
    });

    it('updates existing account', async () => {
        accountRepo.seed([createAccount({ id: 'acc-1', name: 'Old Name' })]);

        const result = await service.execute('acc-1', { name: 'New Name' });

        expect(result).not.toBeNull();
        expect(result!.name).toBe('New Name');
    });

    it('returns null for non-existent id', async () => {
        const result = await service.execute('non-existent', { name: 'Test' });
        expect(result).toBeNull();
    });
});

describe('DeleteAccount', () => {
    let accountRepo: FakeAccountRepository;
    let service: DeleteAccount;

    beforeEach(() => {
        accountRepo = new FakeAccountRepository();
        service = new DeleteAccount(accountRepo);
    });

    it('deletes existing account', async () => {
        accountRepo.seed([createAccount({ id: 'acc-1' })]);

        const result = await service.execute('acc-1');

        expect(result).not.toBeNull();
        expect(result!.id).toBe('acc-1');
        expect(accountRepo.size).toBe(0);
    });

    it('returns null for non-existent id', async () => {
        const result = await service.execute('non-existent');
        expect(result).toBeNull();
    });
});

describe('GetTransactions', () => {
    let txRepo: FakeTransactionRepository;
    let service: GetTransactions;

    beforeEach(() => {
        txRepo = new FakeTransactionRepository();
        service = new GetTransactions(txRepo);
    });

    it('returns empty paginated result', async () => {
        const result = await service.execute({});

        expect(result.transactions).toHaveLength(0);
        expect(result.total).toBe(0);
    });

    it('returns transactions filtered by accountId', async () => {
        txRepo.seed([
            createTransaction({ id: 'tx-1', accountId: 'acc-1' }),
            createTransaction({ id: 'tx-2', accountId: 'acc-2' }),
            createTransaction({ id: 'tx-3', accountId: 'acc-1' }),
        ]);

        const result = await service.execute({ accountId: 'acc-1' });

        expect(result.transactions).toHaveLength(2);
        expect(result.transactions.every(t => t.accountId === 'acc-1')).toBe(true);
    });

    it('returns transactions with pagination', async () => {
        txRepo.seed([
            createTransaction({ id: 'tx-1', date: '2026-03-01' }),
            createTransaction({ id: 'tx-2', date: '2026-03-02' }),
            createTransaction({ id: 'tx-3', date: '2026-03-03' }),
            createTransaction({ id: 'tx-4', date: '2026-03-04' }),
            createTransaction({ id: 'tx-5', date: '2026-03-05' }),
        ]);

        const result = await service.execute({ limit: 2, offset: 1 });

        expect(result.transactions).toHaveLength(2);
        expect(result.total).toBe(5);
        expect(result.limit).toBe(2);
        expect(result.offset).toBe(1);
    });
});

describe('CreateTransaction', () => {
    let txRepo: FakeTransactionRepository;
    let eventBus: EventBus;
    let service: CreateTransaction;

    beforeEach(() => {
        txRepo = new FakeTransactionRepository();
        eventBus = new EventBus();
        service = new CreateTransaction(txRepo, eventBus);
    });

    it('creates transaction and emits TransactionCreated event', async () => {
        const emitted: DomainEvent[] = [];
        eventBus.on('wallet.transaction.created', (event) => {
            emitted.push(event);
        });

        const result = await service.execute({
            accountId: 'acc-1',
            type: 'expense',
            amount: '250.50',
            currency: 'ARS',
            date: '2026-03-20',
            description: 'Groceries',
        });

        expect(result.id).toBeDefined();
        expect(result.accountId).toBe('acc-1');
        expect(result.type).toBe('expense');
        expect(result.amount).toBe('250.50');
        expect(txRepo.size).toBe(1);
        expect(emitted).toHaveLength(1);
    });

    it('event payload matches transaction', async () => {
        const emitted: DomainEvent[] = [];
        eventBus.on('wallet.transaction.created', (event) => {
            emitted.push(event);
        });

        const result = await service.execute({
            accountId: 'acc-1',
            type: 'income',
            amount: '1000',
            currency: 'USD',
            date: '2026-03-20',
        });

        expect(emitted).toHaveLength(1);
        const payload = emitted[0].payload as Record<string, unknown>;
        expect(payload.transactionId).toBe(result.id);
        expect(payload.type).toBe('income');
        expect(payload.amount).toBe('1000');
        expect(payload.currency).toBe('USD');
        expect(payload.accountId).toBe('acc-1');
    });
});

describe('UpdateTransaction', () => {
    let txRepo: FakeTransactionRepository;
    let service: UpdateTransaction;

    beforeEach(() => {
        txRepo = new FakeTransactionRepository();
        service = new UpdateTransaction(txRepo);
    });

    it('updates existing transaction', async () => {
        txRepo.seed([createTransaction({ id: 'tx-1', description: 'Old' })]);

        const result = await service.execute('tx-1', { description: 'Updated' });

        expect(result).not.toBeNull();
        expect(result!.description).toBe('Updated');
    });

    it('returns null for non-existent id', async () => {
        const result = await service.execute('non-existent', { description: 'Test' });
        expect(result).toBeNull();
    });
});

describe('DeleteTransaction', () => {
    let txRepo: FakeTransactionRepository;
    let service: DeleteTransaction;

    beforeEach(() => {
        txRepo = new FakeTransactionRepository();
        service = new DeleteTransaction(txRepo);
    });

    it('deletes existing transaction', async () => {
        txRepo.seed([createTransaction({ id: 'tx-1' })]);

        const result = await service.execute('tx-1');

        expect(result).not.toBeNull();
        expect(result!.id).toBe('tx-1');
        expect(txRepo.size).toBe(0);
    });

    it('returns null for non-existent id', async () => {
        const result = await service.execute('non-existent');
        expect(result).toBeNull();
    });
});

describe('GetCategories', () => {
    let catRepo: FakeCategoryRepository;
    let service: GetCategories;

    beforeEach(() => {
        catRepo = new FakeCategoryRepository();
        service = new GetCategories(catRepo);
    });

    it('returns all categories', async () => {
        catRepo.seed([
            createCategory({ id: 'cat-1', type: 'expense' }),
            createCategory({ id: 'cat-2', type: 'income' }),
        ]);

        const result = await service.execute();

        expect(result).toHaveLength(2);
    });

    it('filters by type', async () => {
        catRepo.seed([
            createCategory({ id: 'cat-1', type: 'expense' }),
            createCategory({ id: 'cat-2', type: 'income' }),
            createCategory({ id: 'cat-3', type: 'expense' }),
        ]);

        const result = await service.execute('expense');

        expect(result).toHaveLength(2);
        expect(result.every(c => c.type === 'expense')).toBe(true);
    });
});

describe('CreateCategory', () => {
    let catRepo: FakeCategoryRepository;
    let service: CreateCategory;

    beforeEach(() => {
        catRepo = new FakeCategoryRepository();
        service = new CreateCategory(catRepo);
    });

    it('creates category', async () => {
        const result = await service.execute({
            name: 'Transport',
            type: 'expense',
            icon: 'bus',
        });

        expect(result.name).toBe('Transport');
        expect(result.type).toBe('expense');
        expect(result.icon).toBe('bus');
        expect(result.id).toBeDefined();
        expect(catRepo.size).toBe(1);
    });
});

describe('GetSpendingStats', () => {
    let txRepo: FakeTransactionRepository;
    let catRepo: FakeCategoryRepository;
    let service: GetSpendingStats;

    beforeEach(() => {
        txRepo = new FakeTransactionRepository();
        catRepo = new FakeCategoryRepository();
        service = new GetSpendingStats(txRepo, catRepo);
    });

    it('returns zero summary when no transactions', async () => {
        const result = await service.executeSummary('2026-01-01', '2026-12-31');

        expect(result.totalIncome).toBe('0.00');
        expect(result.totalExpenses).toBe('0.00');
        expect(result.netBalance).toBe('0.00');
        expect(result.transactionCount).toBe(0);
    });

    it('calculates income/expense/net correctly', async () => {
        txRepo.seed([
            createTransaction({ id: 'tx-1', type: 'income', amount: '3000', date: '2026-03-10' }),
            createTransaction({ id: 'tx-2', type: 'income', amount: '1500', date: '2026-03-12' }),
            createTransaction({ id: 'tx-3', type: 'expense', amount: '800', date: '2026-03-15' }),
            createTransaction({ id: 'tx-4', type: 'expense', amount: '200', date: '2026-03-18' }),
        ]);

        const result = await service.executeSummary('2026-03-01', '2026-03-31');

        expect(result.totalIncome).toBe('4500.00');
        expect(result.totalExpenses).toBe('1000.00');
        expect(result.netBalance).toBe('3500.00');
        expect(result.transactionCount).toBe(4);
    });

    it('groups expenses by category', async () => {
        catRepo.seed([
            createCategory({ id: 'cat-food', name: 'Food', type: 'expense' }),
            createCategory({ id: 'cat-transport', name: 'Transport', type: 'expense' }),
        ]);
        txRepo.seed([
            createTransaction({ id: 'tx-1', type: 'expense', amount: '100', categoryId: 'cat-food', date: '2026-03-10' }),
            createTransaction({ id: 'tx-2', type: 'expense', amount: '150', categoryId: 'cat-food', date: '2026-03-11' }),
            createTransaction({ id: 'tx-3', type: 'expense', amount: '80', categoryId: 'cat-transport', date: '2026-03-12' }),
            createTransaction({ id: 'tx-4', type: 'income', amount: '1000', date: '2026-03-12' }),
        ]);

        const result = await service.executeByCategory('2026-03-01', '2026-03-31');

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            categoryId: 'cat-food',
            categoryName: 'Food',
            total: 250,
            count: 2,
        });
        expect(result[1]).toMatchObject({
            categoryId: 'cat-transport',
            categoryName: 'Transport',
            total: 80,
            count: 1,
        });
    });

    it('builds monthly trend for a year', async () => {
        txRepo.seed([
            createTransaction({ id: 'tx-1', type: 'income', amount: '1000', date: '2026-01-10' }),
            createTransaction({ id: 'tx-2', type: 'expense', amount: '200', date: '2026-01-12' }),
            createTransaction({ id: 'tx-3', type: 'income', amount: '800', date: '2026-02-01' }),
            createTransaction({ id: 'tx-4', type: 'expense', amount: '300', date: '2026-02-15' }),
        ]);

        const result = await service.executeMonthlyTrend(2026);

        expect(result).toEqual([
            { month: '2026-01', income: 1000, expense: 200 },
            { month: '2026-02', income: 800, expense: 300 },
        ]);
    });
});

describe('Savings goals', () => {
    let goalRepo: FakeSavingsGoalRepository;

    beforeEach(() => {
        goalRepo = new FakeSavingsGoalRepository();
    });

    it('lists savings goals', async () => {
        goalRepo.seed([createSavingsGoal(), createSavingsGoal({ id: 'goal-2', name: 'Vacation' })]);
        const service = new GetSavingsGoals(goalRepo);

        const result = await service.execute();

        expect(result).toHaveLength(2);
    });

    it('creates a savings goal', async () => {
        const service = new CreateSavingsGoal(goalRepo);

        const result = await service.execute({
            name: 'Laptop',
            targetAmount: '2500',
            currency: 'USD',
            deadline: '2026-12-31',
        });

        expect(result.name).toBe('Laptop');
        expect(result.currentAmount).toBe('0');
        expect(result.isCompleted).toBe(false);
    });

    it('updates a savings goal', async () => {
        goalRepo.seed([createSavingsGoal({ id: 'goal-1', name: 'Old goal' })]);
        const service = new UpdateSavingsGoal(goalRepo);

        const result = await service.execute('goal-1', { name: 'Updated goal' });

        expect(result?.name).toBe('Updated goal');
    });

    it('applies a contribution and marks completion when target is reached', async () => {
        goalRepo.seed([createSavingsGoal({ id: 'goal-1', targetAmount: '1000', currentAmount: '900' })]);
        const service = new ContributeSavings(goalRepo);

        const result = await service.execute({
            goalId: 'goal-1',
            amount: '150',
            date: '2026-03-20',
        });

        expect(result?.currentAmount).toBe('1050.00');
        expect(result?.isCompleted).toBe(true);
    });
});

describe('Investments', () => {
    let investmentRepo: FakeInvestmentRepository;

    beforeEach(() => {
        investmentRepo = new FakeInvestmentRepository();
    });

    it('lists investments', async () => {
        investmentRepo.seed([createInvestment(), createInvestment({ id: 'inv-2', name: 'Cedear NVDA' })]);
        const service = new GetInvestments(investmentRepo);

        const result = await service.execute();

        expect(result).toHaveLength(2);
    });

    it('creates an investment', async () => {
        const service = new CreateInvestment(investmentRepo);

        const result = await service.execute({
            name: 'Plazo fijo',
            type: 'plazo_fijo',
            currency: 'ARS',
            investedAmount: '5000',
            currentValue: '5300',
            startDate: '2026-03-01',
        });

        expect(result.name).toBe('Plazo fijo');
        expect(result.currentValue).toBe('5300');
    });

    it('updates an investment', async () => {
        investmentRepo.seed([createInvestment({ id: 'inv-1', currentValue: '1000' })]);
        const service = new UpdateInvestment(investmentRepo);

        const result = await service.execute('inv-1', { currentValue: '1250' });

        expect(result?.currentValue).toBe('1250');
    });
});

describe('Exchange rates', () => {
    let exchangeRateRepo: FakeExchangeRateRepository;

    beforeEach(() => {
        exchangeRateRepo = new FakeExchangeRateRepository();
    });

    it('creates an exchange rate', async () => {
        const service = new CreateExchangeRate(exchangeRateRepo);

        const result = await service.execute({
            fromCurrency: 'USD',
            toCurrency: 'ARS',
            rate: '1105.50',
            type: 'mep',
            date: '2026-03-20',
        });

        expect(result.type).toBe('mep');
        expect(result.rate).toBe('1105.50');
    });

    it('returns latest rate per pair and type', async () => {
        exchangeRateRepo.seed([
            createExchangeRate({ id: 'fx-1', type: 'blue', date: '2026-03-19', rate: '1090' }),
            createExchangeRate({ id: 'fx-2', type: 'blue', date: '2026-03-20', rate: '1100' }),
            createExchangeRate({ id: 'fx-3', type: 'mep', date: '2026-03-18', rate: '1080' }),
        ]);
        const service = new GetExchangeRates(exchangeRateRepo);

        const result = await service.executeLatest();

        expect(result).toHaveLength(2);
        expect(result.find((rate) => rate.type === 'blue')?.rate).toBe('1100');
        expect(result.find((rate) => rate.type === 'mep')?.rate).toBe('1080');
    });
});
