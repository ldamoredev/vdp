import {
    carryOverAllSchema,
    carryOverSchema,
    createTaskNoteSchema,
    createTaskSchema,
    domainStatsFiltersSchema,
    markDailyReviewBriefRequestedSchema,
    reviewFiltersSchema,
    reviewStateQuerySchema,
    saveDailyReviewStateSchema,
    taskFiltersSchema,
    taskIdParamsSchema,
    trendFiltersSchema,
    updateTaskSchema,
} from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import {
    carryOverResponse,
    paginatedCollection,
    sendCreated,
    sendMessage,
} from '../../../common/http/responses';
import { assertFound } from '../../../common/http/errors';
import { RouteContextHandler } from '../../../common/http/routes';
import { AddTaskNoteCommand } from '../../app/AddTaskNoteCommand';
import { CarryOverAllPendingCommand } from '../../app/CarryOverAllPendingCommand';
import { CarryOverTaskCommand } from '../../app/CarryOverTaskCommand';
import { CompleteTaskCommand } from '../../app/CompleteTaskCommand';
import { CreateTaskCommand } from '../../app/CreateTaskCommand';
import { DeleteTaskCommand } from '../../app/DeleteTaskCommand';
import { DiscardTaskCommand } from '../../app/DiscardTaskCommand';
import { GetCarryOverRateQuery } from '../../app/GetCarryOverRateQuery';
import { GetCompletionByDomainQuery } from '../../app/GetCompletionByDomainQuery';
import { GetEndOfDayReviewQuery } from '../../app/GetEndOfDayReviewQuery';
import { GetDailyReviewStateQuery } from '../../app/GetDailyReviewStateQuery';
import { MarkDailyReviewBriefRequestedCommand } from '../../app/MarkDailyReviewBriefRequestedCommand';
import { SaveDailyReviewStateCommand } from '../../app/SaveDailyReviewStateCommand';
import { GetTaskQuery } from '../../app/GetTaskQuery';
import { GetTasksQuery } from '../../app/GetTasksQuery';
import { GetTodayStatsQuery } from '../../app/GetTodayStatsQuery';
import { GetTrendStatsQuery } from '../../app/GetTrendStatsQuery';
import { StartTaskCommand } from '../../app/StartTaskCommand';
import { UpdateTaskCommand } from '../../app/UpdateTaskCommand';

type TaskFilters = z.input<typeof taskFiltersSchema>;
type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
type CreateTaskBody = z.input<typeof createTaskSchema>;
type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
type CarryOverBody = z.infer<typeof carryOverSchema>;
type CarryOverAllBody = z.infer<typeof carryOverAllSchema>;
type CreateTaskNoteBody = z.input<typeof createTaskNoteSchema>;
type ReviewFilters = z.infer<typeof reviewFiltersSchema>;
type ReviewStateQuery = z.infer<typeof reviewStateQuerySchema>;
type SaveReviewStateBody = z.infer<typeof saveDailyReviewStateSchema>;
type MarkBriefRequestedBody = z.infer<typeof markDailyReviewBriefRequestedSchema>;
type TrendFilters = z.input<typeof trendFiltersSchema>;
type DomainStatsFilters = z.infer<typeof domainStatsFiltersSchema>;

export class TasksController extends HttpController {
    readonly prefix = '/api/v1/tasks';

    constructor(private readonly bus: CQBus) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        this.registerCrudRoutes(routes);
        this.registerStatusRoutes(routes);
        this.registerNoteRoutes(routes);
        this.registerReviewRoutes(routes);
        this.registerStatsRoutes(routes);
    }

    private registerCrudRoutes(routes: RouteRegister): void {
        routes
            .get('/', { query: taskFiltersSchema }, this.listTasks)
            .get('/:id', { params: taskIdParamsSchema }, this.getTask)
            .post('/', { body: createTaskSchema, query: z.object({ checkDuplicates: z.boolean().optional() }) }, this.createTask)
            .put('/:id', { params: taskIdParamsSchema, body: updateTaskSchema }, this.updateTask)
            .delete('/:id', { params: taskIdParamsSchema }, this.deleteTask);
    }

    private registerStatusRoutes(routes: RouteRegister): void {
        routes
            .post('/:id/start', { params: taskIdParamsSchema }, this.startTask)
            .post('/:id/complete', { params: taskIdParamsSchema }, this.completeTask)
            // body defaults to {} because carry-over accepts an empty POST
            .post('/:id/carry-over', { params: taskIdParamsSchema, body: carryOverSchema.default({}) }, this.carryOverTask)
            .post('/:id/discard', { params: taskIdParamsSchema }, this.discardTask)
            .post('/carry-over-all', { body: carryOverAllSchema }, this.carryOverAllPending);
    }

    private registerNoteRoutes(routes: RouteRegister): void {
        routes
            .get('/:id/notes', { params: taskIdParamsSchema }, this.getTaskNotes)
            .post('/:id/notes', { params: taskIdParamsSchema, body: createTaskNoteSchema }, this.addTaskNote);
    }

    private registerReviewRoutes(routes: RouteRegister): void {
        routes
            .get('/review', { query: reviewFiltersSchema }, this.getReview)
            .get('/review/state', { query: reviewStateQuerySchema }, this.getReviewState)
            .put('/review/state', { body: saveDailyReviewStateSchema }, this.saveReviewState)
            .post('/review/brief-requested', { body: markDailyReviewBriefRequestedSchema }, this.markBriefRequested);
    }

    private registerStatsRoutes(routes: RouteRegister): void {
        routes
            .get('/stats/today', this.getTodayStats)
            .get('/stats/trend', { query: trendFiltersSchema }, this.getTrendStats)
            .get('/stats/by-domain', { query: domainStatsFiltersSchema }, this.getStatsByDomain)
            .get('/stats/carry-over', { query: trendFiltersSchema }, this.getCarryOverRate);
    }

    private readonly listTasks: RouteContextHandler<undefined, TaskFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(new GetTasksQuery(query!), executionContextFromAuth(request.auth));
        return reply.send(paginatedCollection('tasks', result.tasks, result));
    };

    private readonly getTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const task = assertFound(
            await this.bus.execute(new GetTaskQuery(params!.id), executionContextFromAuth(request.auth)),
            'Task not found',
        );
        return reply.send(task);
    };

    private readonly createTask: RouteContextHandler<undefined, { checkDuplicates?: boolean }, CreateTaskBody> = async ({
        request,
        body,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new CreateTaskCommand(body!, query?.checkDuplicates),
            executionContextFromAuth(request.auth),
        );
        return sendCreated(reply, result);
    };

    private readonly updateTask: RouteContextHandler<TaskIdParams, undefined, UpdateTaskBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const updated = assertFound(
            await this.bus.execute(new UpdateTaskCommand(params!.id, body!), executionContextFromAuth(request.auth)),
            'Task not found',
        );
        return reply.send(updated);
    };

    private readonly deleteTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        assertFound(
            await this.bus.execute(new DeleteTaskCommand(params!.id), executionContextFromAuth(request.auth)),
            'Task not found',
        );
        return sendMessage(reply, 'Task deleted');
    };

    private readonly completeTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const completed = assertFound(
            await this.bus.execute(new CompleteTaskCommand(params!.id), executionContextFromAuth(request.auth)),
            'Task not found',
        );
        return reply.send(completed);
    };

    private readonly startTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const started = assertFound(
            await this.bus.execute(new StartTaskCommand(params!.id), executionContextFromAuth(request.auth)),
            'Task not found',
        );
        return reply.send(started);
    };

    private readonly carryOverTask: RouteContextHandler<TaskIdParams, undefined, CarryOverBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const carried = assertFound(
            await this.bus.execute(
                new CarryOverTaskCommand(params!.id, body!.toDate),
                executionContextFromAuth(request.auth),
            ),
            'Task not found',
        );
        return reply.send(carried);
    };

    private readonly discardTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const discarded = assertFound(
            await this.bus.execute(new DiscardTaskCommand(params!.id), executionContextFromAuth(request.auth)),
            'Task not found',
        );
        return reply.send(discarded);
    };

    private readonly carryOverAllPending: RouteContextHandler<undefined, undefined, CarryOverAllBody> = async ({
        request,
        body,
        reply,
    }) => {
        const results = await this.bus.execute(
            new CarryOverAllPendingCommand(body!.fromDate, body!.toDate),
            executionContextFromAuth(request.auth),
        );
        return reply.send(carryOverResponse(results));
    };

    private readonly getTaskNotes: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const result = assertFound(
            await this.bus.execute(new GetTaskQuery(params!.id), executionContextFromAuth(request.auth)),
            'Task not found',
        );
        return reply.send(result.notes);
    };

    private readonly addTaskNote: RouteContextHandler<TaskIdParams, undefined, CreateTaskNoteBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const note = await this.bus.execute(
            new AddTaskNoteCommand(params!.id, body!.content, body!.type),
            executionContextFromAuth(request.auth),
        );
        return sendCreated(reply, note);
    };

    private readonly getReview: RouteContextHandler<undefined, ReviewFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetEndOfDayReviewQuery(query!.date),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly getReviewState: RouteContextHandler<undefined, ReviewStateQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetDailyReviewStateQuery(query!.date),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly saveReviewState: RouteContextHandler<undefined, undefined, SaveReviewStateBody> = async ({
        request,
        body,
        reply,
    }) => {
        const result = await this.bus.execute(
            new SaveDailyReviewStateCommand(body!),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly markBriefRequested: RouteContextHandler<undefined, undefined, MarkBriefRequestedBody> = async ({
        request,
        body,
        reply,
    }) => {
        const result = await this.bus.execute(
            new MarkDailyReviewBriefRequestedCommand(body!.date, body!.surface),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly getTodayStats = async (request: FastifyRequest, reply: FastifyReply) => {
        const result = await this.bus.execute(new GetTodayStatsQuery(), executionContextFromAuth(request.auth));
        return reply.send(result);
    };

    private readonly getTrendStats: RouteContextHandler<undefined, TrendFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetTrendStatsQuery(query!.days),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly getStatsByDomain: RouteContextHandler<undefined, DomainStatsFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetCompletionByDomainQuery(query!.from, query!.to),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };

    private readonly getCarryOverRate: RouteContextHandler<undefined, TrendFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const result = await this.bus.execute(
            new GetCarryOverRateQuery(query!.days),
            executionContextFromAuth(request.auth),
        );
        return reply.send(result);
    };
}
