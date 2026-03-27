import {
    createAccountSchema,
    updateAccountSchema,
    createCategorySchema,
    createTransactionSchema,
    updateTransactionSchema,
    transactionFiltersSchema,
    statsQuerySchema,
    createSavingsGoalSchema,
    updateSavingsGoalSchema,
    createInvestmentSchema,
    updateInvestmentSchema,
} from '@vdp/shared';
import { z } from 'zod';

import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { paginatedCollection, sendCreated, sendMessage } from '../../../common/http/responses';
import { ServiceResolver } from '../../../common/http/ServiceResolver';
import { assertFound } from '../../../common/http/errors';
import { RouteContextHandler } from '../../../common/http/routes';

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

const idParamsSchema = z.object({ id: z.string().uuid() });
const categoryQuerySchema = z.object({ type: z.string().optional() });
const contributionBodySchema = z.object({
    amount: z.string().refine((value) => parseFloat(value) > 0, 'Amount must be positive'),
    date: z.string().optional(),
    note: z.string().max(255).nullable().optional(),
    transactionId: z.string().uuid().nullable().optional(),
});
const createExchangeRateBodySchema = z.object({
    fromCurrency: z.enum(['ARS', 'USD']),
    toCurrency: z.enum(['ARS', 'USD']),
    rate: z.string().refine((value) => parseFloat(value) > 0, 'Rate must be positive'),
    type: z.enum(['official', 'blue', 'mep', 'ccl']),
    date: z.string().optional(),
});

type IdParams = z.infer<typeof idParamsSchema>;
type CreateAccountBody = z.input<typeof createAccountSchema>;
type UpdateAccountBody = z.input<typeof updateAccountSchema>;
type CreateTransactionBody = z.input<typeof createTransactionSchema>;
type UpdateTransactionBody = z.input<typeof updateTransactionSchema>;
type TransactionFilters = z.input<typeof transactionFiltersSchema>;
type CategoryQuery = z.infer<typeof categoryQuerySchema>;
type CreateCategoryBody = z.infer<typeof createCategorySchema>;
type StatsQuery = z.input<typeof statsQuerySchema>;
type CreateSavingsGoalBody = z.input<typeof createSavingsGoalSchema>;
type UpdateSavingsGoalBody = z.input<typeof updateSavingsGoalSchema>;
type ContributionBody = z.infer<typeof contributionBodySchema>;
type CreateInvestmentBody = z.input<typeof createInvestmentSchema>;
type UpdateInvestmentBody = z.input<typeof updateInvestmentSchema>;
type CreateExchangeRateBody = z.infer<typeof createExchangeRateBodySchema>;

export class WalletController extends HttpController {
    readonly prefix = '/api/v1/wallet';

    constructor(private services: ServiceResolver) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        this.registerAccountRoutes(routes);
        this.registerCategoryRoutes(routes);
        this.registerTransactionRoutes(routes);
        this.registerStatsRoutes(routes);
        this.registerSavingsRoutes(routes);
        this.registerInvestmentRoutes(routes);
        this.registerExchangeRateRoutes(routes);
    }

    private registerAccountRoutes(routes: RouteRegister): void {
        routes
            .get('/accounts', this.listAccounts)
            .post('/accounts', { body: createAccountSchema }, this.createAccount)
            .put('/accounts/:id', { params: idParamsSchema, body: updateAccountSchema }, this.updateAccount)
            .delete('/accounts/:id', { params: idParamsSchema }, this.deleteAccount);
    }

    private registerCategoryRoutes(routes: RouteRegister): void {
        routes
            .get('/categories', { query: categoryQuerySchema }, this.listCategories)
            .post('/categories', { body: createCategorySchema }, this.createCategory);
    }

    private registerTransactionRoutes(routes: RouteRegister): void {
        routes
            .get('/transactions', { query: transactionFiltersSchema }, this.listTransactions)
            .post('/transactions', { body: createTransactionSchema }, this.createTransaction)
            .put('/transactions/:id', { params: idParamsSchema, body: updateTransactionSchema }, this.updateTransaction)
            .delete('/transactions/:id', { params: idParamsSchema }, this.deleteTransaction);
    }

    private registerStatsRoutes(routes: RouteRegister): void {
        routes
            .get('/stats/summary', { query: statsQuerySchema }, this.getStatsSummary)
            .get('/stats/by-category', { query: statsQuerySchema }, this.getStatsByCategory)
            .get('/stats/monthly-trend', { query: statsQuerySchema }, this.getMonthlyTrend);
    }

    private registerSavingsRoutes(routes: RouteRegister): void {
        routes
            .get('/savings', this.listSavingsGoals)
            .post('/savings', { body: createSavingsGoalSchema }, this.createSavingsGoal)
            .put('/savings/:id', { params: idParamsSchema, body: updateSavingsGoalSchema }, this.updateSavingsGoal)
            .post('/savings/:id/contribute', { params: idParamsSchema, body: contributionBodySchema }, this.contributeSavings);
    }

    private registerInvestmentRoutes(routes: RouteRegister): void {
        routes
            .get('/investments', this.listInvestments)
            .post('/investments', { body: createInvestmentSchema }, this.createInvestment)
            .put('/investments/:id', { params: idParamsSchema, body: updateInvestmentSchema }, this.updateInvestment);
    }

    private registerExchangeRateRoutes(routes: RouteRegister): void {
        routes
            .get('/exchange-rates/latest', this.getLatestExchangeRates)
            .post('/exchange-rates', { body: createExchangeRateBodySchema }, this.createExchangeRate);
    }

    // ─── Accounts ────────────────────────────────────────────

    private readonly listAccounts = async (_request: unknown, reply: { send: (data: unknown) => void }) => {
        const accounts = await this.services.get(GetAccounts).execute();
        return reply.send(accounts);
    };

    private readonly createAccount: RouteContextHandler<undefined, undefined, CreateAccountBody> = async ({
        body,
        reply,
    }) => {
        const account = await this.services.get(CreateAccount).execute(body!);
        return sendCreated(reply, account);
    };

    private readonly updateAccount: RouteContextHandler<IdParams, undefined, UpdateAccountBody> = async ({
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.services.get(UpdateAccount).execute(params!.id, body!),
            'Account not found',
        );
        return reply.send(updated);
    };

    private readonly deleteAccount: RouteContextHandler<IdParams, undefined, undefined> = async ({
        params,
        reply,
    }) => {
        assertFound(await this.services.get(DeleteAccount).execute(params!.id), 'Account not found');
        return sendMessage(reply, 'Account deleted');
    };

    // ─── Categories ──────────────────────────────────────────

    private readonly listCategories: RouteContextHandler<undefined, CategoryQuery, undefined> = async ({
        query,
        reply,
    }) => {
        const categories = await this.services.get(GetCategories).execute(query?.type);
        return reply.send(categories);
    };

    private readonly createCategory: RouteContextHandler<undefined, undefined, CreateCategoryBody> = async ({
        body,
        reply,
    }) => {
        const category = await this.services.get(CreateCategory).execute(body!);
        return sendCreated(reply, category);
    };

    // ─── Transactions ────────────────────────────────────────

    private readonly listTransactions: RouteContextHandler<undefined, TransactionFilters, undefined> = async ({
        query,
        reply,
    }) => {
        const result = await this.services.get(GetTransactions).execute(query!);
        return reply.send(paginatedCollection('transactions', result.transactions, result));
    };

    private readonly createTransaction: RouteContextHandler<undefined, undefined, CreateTransactionBody> = async ({
        body,
        reply,
    }) => {
        const tx = await this.services.get(CreateTransaction).execute(body!);
        return sendCreated(reply, tx);
    };

    private readonly updateTransaction: RouteContextHandler<IdParams, undefined, UpdateTransactionBody> = async ({
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.services.get(UpdateTransaction).execute(params!.id, body!),
            'Transaction not found',
        );
        return reply.send(updated);
    };

    private readonly deleteTransaction: RouteContextHandler<IdParams, undefined, undefined> = async ({
        params,
        reply,
    }) => {
        assertFound(
            await this.services.get(DeleteTransaction).execute(params!.id),
            'Transaction not found',
        );
        return sendMessage(reply, 'Transaction deleted');
    };

    // ─── Stats ───────────────────────────────────────────────

    private readonly getStatsSummary: RouteContextHandler<undefined, StatsQuery, undefined> = async ({
        query,
        reply,
    }) => {
        const result = await this.services.get(GetSpendingStats).executeSummary(query?.from, query?.to);
        return reply.send(result);
    };

    private readonly getStatsByCategory: RouteContextHandler<undefined, StatsQuery, undefined> = async ({
        query,
        reply,
    }) => {
        const result = await this.services.get(GetSpendingStats).executeByCategory(query?.from, query?.to);
        return reply.send(result);
    };

    private readonly getMonthlyTrend: RouteContextHandler<undefined, StatsQuery, undefined> = async ({
        query,
        reply,
    }) => {
        const result = await this.services.get(GetSpendingStats).executeMonthlyTrend(query?.year);
        return reply.send(result);
    };

    // ─── Savings ───────────────────────────────────────────

    private readonly listSavingsGoals = async (_request: unknown, reply: { send: (data: unknown) => void }) => {
        const goals = await this.services.get(GetSavingsGoals).execute();
        return reply.send(goals);
    };

    private readonly createSavingsGoal: RouteContextHandler<undefined, undefined, CreateSavingsGoalBody> = async ({
        body,
        reply,
    }) => {
        const goal = await this.services.get(CreateSavingsGoal).execute(body!);
        return sendCreated(reply, goal);
    };

    private readonly updateSavingsGoal: RouteContextHandler<IdParams, undefined, UpdateSavingsGoalBody> = async ({
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.services.get(UpdateSavingsGoal).execute(params!.id, body!),
            'Savings goal not found',
        );
        return reply.send(updated);
    };

    private readonly contributeSavings: RouteContextHandler<IdParams, undefined, ContributionBody> = async ({
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.services.get(ContributeSavings).execute({
                goalId: params!.id,
                amount: body!.amount,
                date: body!.date,
                note: body!.note ?? null,
                transactionId: body!.transactionId ?? null,
            }),
            'Savings goal not found',
        );
        return reply.send(updated);
    };

    // ─── Investments ──────────────────────────────────────

    private readonly listInvestments = async (_request: unknown, reply: { send: (data: unknown) => void }) => {
        const investments = await this.services.get(GetInvestments).execute();
        return reply.send(investments);
    };

    private readonly createInvestment: RouteContextHandler<undefined, undefined, CreateInvestmentBody> = async ({
        body,
        reply,
    }) => {
        const investment = await this.services.get(CreateInvestment).execute(body!);
        return sendCreated(reply, investment);
    };

    private readonly updateInvestment: RouteContextHandler<IdParams, undefined, UpdateInvestmentBody> = async ({
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.services.get(UpdateInvestment).execute(params!.id, body!),
            'Investment not found',
        );
        return reply.send(updated);
    };

    // ─── Exchange Rates ───────────────────────────────────

    private readonly getLatestExchangeRates = async (_request: unknown, reply: { send: (data: unknown) => void }) => {
        const rates = await this.services.get(GetExchangeRates).executeLatest();
        return reply.send(rates);
    };

    private readonly createExchangeRate: RouteContextHandler<undefined, undefined, CreateExchangeRateBody> = async ({
        body,
        reply,
    }) => {
        const rate = await this.services.get(CreateExchangeRate).execute(body!);
        return sendCreated(reply, rate);
    };
}
