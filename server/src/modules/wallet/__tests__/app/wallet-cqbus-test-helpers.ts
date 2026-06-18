import { Identity } from '@nbottarini/cqbus';
import { vi } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { Account } from '../../domain/Account';
import { Category } from '../../domain/Category';
import { ExchangeRate } from '../../domain/ExchangeRate';
import { Investment } from '../../domain/Investment';
import { SavingsGoal } from '../../domain/SavingsGoal';
import { Transaction } from '../../domain/Transaction';
import { FakeAccountRepository } from '../fakes/FakeAccountRepository';
import { FakeCategoryRepository } from '../fakes/FakeCategoryRepository';
import { FakeExchangeRateRepository } from '../fakes/FakeExchangeRateRepository';
import { FakeInvestmentRepository } from '../fakes/FakeInvestmentRepository';
import { FakeSavingsGoalRepository } from '../fakes/FakeSavingsGoalRepository';
import { FakeTransactionRepository } from '../fakes/FakeTransactionRepository';

export const userId = 'user-1';
export const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
export const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

export type WalletCQBusTestContext = {
    readonly accounts: FakeAccountRepository;
    readonly transactions: FakeTransactionRepository;
    readonly categories: FakeCategoryRepository;
    readonly savingsGoals: FakeSavingsGoalRepository;
    readonly investments: FakeInvestmentRepository;
    readonly exchangeRates: FakeExchangeRateRepository;
    readonly eventBus: EventBus;
};

export function setupWalletCQBusTest(): WalletCQBusTestContext {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 12, 0, 0));

    return {
        accounts: new FakeAccountRepository(),
        transactions: new FakeTransactionRepository(),
        categories: new FakeCategoryRepository(),
        savingsGoals: new FakeSavingsGoalRepository(),
        investments: new FakeInvestmentRepository(),
        exchangeRates: new FakeExchangeRateRepository(),
        eventBus: new EventBus(),
    };
}

export function makeAccount(overrides: Partial<Account> = {}): Account {
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

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: overrides.id ?? 'tx-1',
        accountId: overrides.accountId ?? 'acc-1',
        categoryId: overrides.categoryId ?? null,
        type: overrides.type ?? 'expense',
        amount: overrides.amount ?? '100',
        currency: overrides.currency ?? 'ARS',
        description: overrides.description ?? 'Test transaction',
        date: overrides.date ?? '2026-06-17',
        transferToAccountId: overrides.transferToAccountId ?? null,
        tags: overrides.tags ?? [],
        createdAt: overrides.createdAt ?? new Date(),
        updatedAt: overrides.updatedAt ?? new Date(),
    };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
    return {
        id: overrides.id ?? 'cat-1',
        name: overrides.name ?? 'Food',
        type: overrides.type ?? 'expense',
        icon: overrides.icon ?? null,
        parentId: overrides.parentId ?? null,
        createdAt: overrides.createdAt ?? new Date(),
    };
}

export function makeSavingsGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
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

export function makeInvestment(overrides: Partial<Investment> = {}): Investment {
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

export function makeExchangeRate(overrides: Partial<ExchangeRate> = {}): ExchangeRate {
    return {
        id: overrides.id ?? 'fx-1',
        fromCurrency: overrides.fromCurrency ?? 'USD',
        toCurrency: overrides.toCurrency ?? 'ARS',
        rate: overrides.rate ?? '1100.00',
        type: overrides.type ?? 'blue',
        date: overrides.date ?? '2026-06-17',
        createdAt: overrides.createdAt ?? new Date(),
    };
}
