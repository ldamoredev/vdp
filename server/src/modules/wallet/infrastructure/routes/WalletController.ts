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
    createRecurringTransactionSchema,
} from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';
import { z } from 'zod';

import { FastifyRequest, FastifyReply } from 'fastify';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { paginatedCollection, sendCreated, sendMessage } from '../../../common/http/responses';
import { assertFound } from '../../../common/http/errors';
import { RouteContextHandler } from '../../../common/http/routes';
import { ContributeSavingsCommand } from '../../app/ContributeSavingsCommand';
import { CreateAccountCommand } from '../../app/CreateAccountCommand';
import { CreateCategoryCommand } from '../../app/CreateCategoryCommand';
import { CreateExchangeRateCommand } from '../../app/CreateExchangeRateCommand';
import { CreateInvestmentCommand } from '../../app/CreateInvestmentCommand';
import { CreateSavingsGoalCommand } from '../../app/CreateSavingsGoalCommand';
import { CreateTransactionCommand } from '../../app/CreateTransactionCommand';
import { DeleteAccountCommand } from '../../app/DeleteAccountCommand';
import { DeleteTransactionCommand } from '../../app/DeleteTransactionCommand';
import { GetAccountsQuery } from '../../app/GetAccountsQuery';
import { GetCategoriesQuery } from '../../app/GetCategoriesQuery';
import { GetExchangeRatesQuery } from '../../app/GetExchangeRatesQuery';
import { GetFoodSpendingThisWeekQuery } from '../../app/GetFoodSpendingThisWeekQuery';
import { CreateRecurringTransactionCommand } from '../../app/CreateRecurringTransactionCommand';
import { GetRecurringTransactionsQuery } from '../../app/GetRecurringTransactionsQuery';
import { DeleteRecurringTransactionCommand } from '../../app/DeleteRecurringTransactionCommand';
import { MaterializeDueRecurringTransactionsCommand } from '../../app/MaterializeDueRecurringTransactionsCommand';
import { GetInvestmentsQuery } from '../../app/GetInvestmentsQuery';
import { GetMonthlyTrendQuery } from '../../app/GetMonthlyTrendQuery';
import { GetSavingsGoalsQuery } from '../../app/GetSavingsGoalsQuery';
import { GetSpendingByCategoryQuery } from '../../app/GetSpendingByCategoryQuery';
import { GetSpendingSummaryQuery } from '../../app/GetSpendingSummaryQuery';
import { RefreshExchangeRatesCommand } from '../../app/RefreshExchangeRatesCommand';
import { GetTransactionsQuery } from '../../app/GetTransactionsQuery';
import { UpdateAccountCommand } from '../../app/UpdateAccountCommand';
import { UpdateInvestmentCommand } from '../../app/UpdateInvestmentCommand';
import { UpdateSavingsGoalCommand } from '../../app/UpdateSavingsGoalCommand';
import { UpdateTransactionCommand } from '../../app/UpdateTransactionCommand';

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
type CreateRecurringBody = z.infer<typeof createRecurringTransactionSchema>;
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

    constructor(private readonly bus: CQBus) {
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
        this.registerRecurringRoutes(routes);
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
            .get('/stats/monthly-trend', { query: statsQuerySchema }, this.getMonthlyTrend)
            .get('/stats/food-this-week', this.getFoodSpendingThisWeek);
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
            .post('/exchange-rates', { body: createExchangeRateBodySchema }, this.createExchangeRate)
            .post('/exchange-rates/refresh', this.refreshExchangeRates);
    }

    private registerRecurringRoutes(routes: RouteRegister): void {
        routes
            .get('/recurring', this.listRecurring)
            .post('/recurring', { body: createRecurringTransactionSchema }, this.createRecurring)
            .delete('/recurring/:id', { params: idParamsSchema }, this.deleteRecurring)
            .post('/recurring/materialize', this.materializeRecurring);
    }

    // ─── Accounts ────────────────────────────────────────────

    private readonly listAccounts = async (request: FastifyRequest, reply: FastifyReply) => {
        const accounts = await this.bus.execute(new GetAccountsQuery(), executionContextFromAuth(request.auth));
        return reply.send(accounts);
    };

    private readonly createAccount: RouteContextHandler<undefined, undefined, CreateAccountBody> = async ({
        request,
        body,
        reply,
    }) => {
        const account = await this.bus.execute(new CreateAccountCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, account);
    };

    private readonly updateAccount: RouteContextHandler<IdParams, undefined, UpdateAccountBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.bus.execute(new UpdateAccountCommand(params!.id, body!), executionContextFromAuth(request.auth)),
            'Account not found',
        );
        return reply.send(updated);
    };

    private readonly deleteAccount: RouteContextHandler<IdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        assertFound(
            await this.bus.execute(new DeleteAccountCommand(params!.id), executionContextFromAuth(request.auth)),
            'Account not found',
        );
        return sendMessage(reply, 'Account deleted');
    };

    // ─── Categories ──────────────────────────────────────────

    private readonly listCategories: RouteContextHandler<undefined, CategoryQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const categories = await this.bus.execute(
            new GetCategoriesQuery(query?.type),
            executionContextFromAuth(request.auth),
        );
        return reply.send(categories);
    };

    private readonly createCategory: RouteContextHandler<undefined, undefined, CreateCategoryBody> = async ({
        request,
        body,
        reply,
    }) => {
        const category = await this.bus.execute(new CreateCategoryCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, category);
    };

    // ─── Transactions ────────────────────────────────────────

    private readonly listTransactions: RouteContextHandler<undefined, TransactionFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetTransactionsQuery(query!),
            executionContextFromAuth(request.auth),
        );
        return reply.send(paginatedCollection('transactions', result.transactions, result));
    };

    private readonly createTransaction: RouteContextHandler<undefined, undefined, CreateTransactionBody> = async ({
        request,
        body,
        reply,
    }) => {
        const tx = await this.bus.execute(new CreateTransactionCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, tx);
    };

    private readonly updateTransaction: RouteContextHandler<IdParams, undefined, UpdateTransactionBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.bus.execute(
                new UpdateTransactionCommand(params!.id, body!),
                executionContextFromAuth(request.auth),
            ),
            'Transaction not found',
        );
        return reply.send(updated);
    };

    private readonly deleteTransaction: RouteContextHandler<IdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        assertFound(
            await this.bus.execute(new DeleteTransactionCommand(params!.id), executionContextFromAuth(request.auth)),
            'Transaction not found',
        );
        return sendMessage(reply, 'Transaction deleted');
    };

    // ─── Stats ───────────────────────────────────────────────

    private readonly getStatsSummary: RouteContextHandler<undefined, StatsQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetSpendingSummaryQuery(query?.from, query?.to, undefined, query?.currency),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly getStatsByCategory: RouteContextHandler<undefined, StatsQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetSpendingByCategoryQuery(query?.from, query?.to, query?.currency),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly getMonthlyTrend: RouteContextHandler<undefined, StatsQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetMonthlyTrendQuery(query?.year, query?.currency),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly getFoodSpendingThisWeek = async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await this.bus.execute(
            new GetFoodSpendingThisWeekQuery(),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    // ─── Recurring transactions ──────────────────────────────

    private readonly listRecurring = async (request: FastifyRequest, reply: FastifyReply) => {
        const rules = await this.bus.execute(new GetRecurringTransactionsQuery(), executionContextFromAuth(request.auth));
        return reply.send(rules.map((rule) => rule.toSnapshot()));
    };

    private readonly createRecurring: RouteContextHandler<undefined, undefined, CreateRecurringBody> = async ({
        request,
        body,
        reply,
    }) => {
        const created = await this.bus.execute(
            new CreateRecurringTransactionCommand(body!),
            executionContextFromAuth(request.auth),
        );
        return sendCreated(reply, created.toSnapshot());
    };

    private readonly deleteRecurring: RouteContextHandler<IdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const deleted = await this.bus.execute(
            new DeleteRecurringTransactionCommand(params!.id),
            executionContextFromAuth(request.auth),
        );
        assertFound(deleted, 'Recurring transaction not found');
        return sendMessage(reply, 'Recurring transaction deleted');
    };

    private readonly materializeRecurring = async (request: FastifyRequest, reply: FastifyReply) => {
        const created = await this.bus.execute(
            new MaterializeDueRecurringTransactionsCommand(),
            executionContextFromAuth(request.auth),
        );
        return reply.send({ created });
    };

    // ─── Savings ───────────────────────────────────────────

    private readonly listSavingsGoals = async (request: FastifyRequest, reply: FastifyReply) => {
        const goals = await this.bus.execute(new GetSavingsGoalsQuery(), executionContextFromAuth(request.auth));
        return reply.send(goals);
    };

    private readonly createSavingsGoal: RouteContextHandler<undefined, undefined, CreateSavingsGoalBody> = async ({
        request,
        body,
        reply,
    }) => {
        const goal = await this.bus.execute(new CreateSavingsGoalCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, goal);
    };

    private readonly updateSavingsGoal: RouteContextHandler<IdParams, undefined, UpdateSavingsGoalBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.bus.execute(
                new UpdateSavingsGoalCommand(params!.id, body!),
                executionContextFromAuth(request.auth),
            ),
            'Savings goal not found',
        );
        return reply.send(updated);
    };

    private readonly contributeSavings: RouteContextHandler<IdParams, undefined, ContributionBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.bus.execute(new ContributeSavingsCommand({
                goalId: params!.id,
                amount: body!.amount,
                date: body!.date,
                note: body!.note ?? null,
                transactionId: body!.transactionId ?? null,
            }), executionContextFromAuth(request.auth)),
            'Savings goal not found',
        );
        return reply.send(updated);
    };

    // ─── Investments ──────────────────────────────────────

    private readonly listInvestments = async (request: FastifyRequest, reply: FastifyReply) => {
        const investments = await this.bus.execute(new GetInvestmentsQuery(), executionContextFromAuth(request.auth));
        return reply.send(investments);
    };

    private readonly createInvestment: RouteContextHandler<undefined, undefined, CreateInvestmentBody> = async ({
        request,
        body,
        reply,
    }) => {
        const investment = await this.bus.execute(new CreateInvestmentCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, investment);
    };

    private readonly updateInvestment: RouteContextHandler<IdParams, undefined, UpdateInvestmentBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.bus.execute(
                new UpdateInvestmentCommand(params!.id, body!),
                executionContextFromAuth(request.auth),
            ),
            'Investment not found',
        );
        return reply.send(updated);
    };

    // ─── Exchange Rates ───────────────────────────────────

    private readonly getLatestExchangeRates = async (_request: FastifyRequest, reply: FastifyReply) => {
        const rates = await this.bus.execute(new GetExchangeRatesQuery());
        return reply.send(rates);
    };

    private readonly createExchangeRate: RouteContextHandler<undefined, undefined, CreateExchangeRateBody> = async ({
        body,
        reply,
    }) => {
        const rate = await this.bus.execute(new CreateExchangeRateCommand(body!));
        return sendCreated(reply, rate);
    };

    private readonly refreshExchangeRates = async (request: FastifyRequest, reply: FastifyReply) => {
        const rates = await this.bus.execute(
            new RefreshExchangeRatesCommand(),
            executionContextFromAuth(request.auth),
        );
        return reply.send(rates);
    };
}
