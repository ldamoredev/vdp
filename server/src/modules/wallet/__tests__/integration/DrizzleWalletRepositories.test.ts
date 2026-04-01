import { beforeEach, describe, expect, it } from 'vitest';
import { DrizzleAccountRepository } from '../../infrastructure/db/DrizzleAccountRepository';
import { DrizzleCategoryRepository } from '../../infrastructure/db/DrizzleCategoryRepository';
import { DrizzleTransactionRepository } from '../../infrastructure/db/DrizzleTransactionRepository';
import { DrizzleSavingsGoalRepository } from '../../infrastructure/db/DrizzleSavingsGoalRepository';
import { DrizzleInvestmentRepository } from '../../infrastructure/db/DrizzleInvestmentRepository';
import { DrizzleExchangeRateRepository } from '../../infrastructure/db/DrizzleExchangeRateRepository';
import { testDb } from './test-database';

const accountRepo = new DrizzleAccountRepository(testDb as never);
const categoryRepo = new DrizzleCategoryRepository(testDb as never);
const transactionRepo = new DrizzleTransactionRepository(testDb as never);
const savingsGoalRepo = new DrizzleSavingsGoalRepository(testDb as never);
const investmentRepo = new DrizzleInvestmentRepository(testDb as never);
const exchangeRateRepo = new DrizzleExchangeRateRepository(testDb as never);

beforeEach(async () => {
    await testDb.truncate();
});

describe('Drizzle wallet repositories', () => {
    describe('accounts', () => {
        it('creates, updates, lists, and deletes accounts', async () => {
            const created = await accountRepo.create({
                name: 'Primary',
                currency: 'ARS',
                type: 'bank',
                initialBalance: '1500.50',
            });

            const listed = await accountRepo.findAll();
            expect(listed).toHaveLength(1);
            expect(listed[0].name).toBe('Primary');

            const updated = await accountRepo.update(created.id, { name: 'Main account' });
            expect(updated).not.toBeNull();
            expect(updated!.name).toBe('Main account');
            expect(updated!.initialBalance).toBe('1500.50');

            const deleted = await accountRepo.delete(created.id);
            expect(deleted?.id).toBe(created.id);
            await expect(accountRepo.findById(created.id)).resolves.toBeNull();
        });
    });

    describe('categories and transactions', () => {
        it('persists transaction filters, ordering, and account sums', async () => {
            const account = await accountRepo.create({
                name: 'Checking',
                currency: 'ARS',
                type: 'bank',
                initialBalance: '1000',
            });
            const groceries = await categoryRepo.create({ name: 'Groceries', type: 'expense' });
            const salary = await categoryRepo.create({ name: 'Salary', type: 'income' });

            const older = await transactionRepo.create({
                accountId: account.id,
                categoryId: groceries.id,
                type: 'expense',
                amount: '120.25',
                currency: 'ARS',
                description: 'Weekly groceries',
                date: '2026-03-10',
                tags: ['food'],
            });
            await transactionRepo.create({
                accountId: account.id,
                categoryId: salary.id,
                type: 'income',
                amount: '900.00',
                currency: 'ARS',
                description: 'Salary payment',
                date: '2026-03-12',
                tags: ['salary'],
            });
            const newer = await transactionRepo.create({
                accountId: account.id,
                categoryId: groceries.id,
                type: 'expense',
                amount: '80.00',
                currency: 'ARS',
                description: 'Groceries top up',
                date: '2026-03-15',
                tags: ['food', 'market'],
            });

            const filtered = await transactionRepo.list({
                type: 'expense',
                search: 'Groceries',
                from: '2026-03-01',
                to: '2026-03-31',
                limit: 10,
                offset: 0,
            });

            expect(filtered.total).toBe(2);
            expect(filtered.transactions.map((transaction) => transaction.id)).toEqual([newer.id, older.id]);

            const accountBalanceDelta = await transactionRepo.sumByAccountId(account.id);
            expect(accountBalanceDelta).toBe('699.75');

            const rangedNet = await transactionRepo.sumByDateRange('2026-03-11', '2026-03-31', account.id);
            expect(rangedNet).toBe('820.00');
        });
    });

    describe('savings goals', () => {
        it('tracks contributions and completion state', async () => {
            const goal = await savingsGoalRepo.create({
                name: 'Emergency fund',
                targetAmount: '500.00',
                currency: 'USD',
                deadline: '2026-12-31',
            });

            const afterFirstContribution = await savingsGoalRepo.contribute(goal.id, {
                amount: '200.00',
                date: '2026-03-20',
                note: 'Initial transfer',
            });
            expect(afterFirstContribution).not.toBeNull();
            expect(afterFirstContribution!.currentAmount).toBe('200.00');
            expect(afterFirstContribution!.isCompleted).toBe(false);

            const completed = await savingsGoalRepo.contribute(goal.id, {
                amount: '300.00',
                date: '2026-03-21',
            });
            expect(completed).not.toBeNull();
            expect(completed!.currentAmount).toBe('500.00');
            expect(completed!.isCompleted).toBe(true);
        });
    });

    describe('investments', () => {
        it('creates and updates investments without losing optional fields', async () => {
            const account = await accountRepo.create({
                name: 'Brokerage',
                currency: 'USD',
                type: 'investment',
                initialBalance: '0',
            });

            const created = await investmentRepo.create({
                name: 'S&P 500 ETF',
                type: 'cedear',
                accountId: account.id,
                currency: 'USD',
                investedAmount: '1000.00',
                currentValue: '1120.50',
                startDate: '2026-01-15',
                rate: '0.1205',
                notes: 'Long term position',
            });

            const updated = await investmentRepo.update(created.id, {
                currentValue: '1180.75',
                notes: 'Revalued after earnings',
            });

            expect(updated).not.toBeNull();
            expect(updated!.currentValue).toBe('1180.75');
            expect(updated!.notes).toBe('Revalued after earnings');
            expect(updated!.accountId).toBe(account.id);
        });
    });

    describe('exchange rates', () => {
        it('stores multiple dated rates for the same pair', async () => {
            await exchangeRateRepo.create({
                fromCurrency: 'USD',
                toCurrency: 'ARS',
                rate: '1095.1000',
                type: 'blue',
                date: '2026-03-20',
            });
            await exchangeRateRepo.create({
                fromCurrency: 'USD',
                toCurrency: 'ARS',
                rate: '1102.2500',
                type: 'blue',
                date: '2026-03-21',
            });

            const allRates = await exchangeRateRepo.findAll();
            expect(allRates).toHaveLength(2);
            expect(allRates.map((rate) => rate.date)).toEqual(['2026-03-20', '2026-03-21']);
        });
    });
});
