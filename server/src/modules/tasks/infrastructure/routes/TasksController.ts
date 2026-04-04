import {
    carryOverAllSchema,
    carryOverSchema,
    createTaskNoteSchema,
    createTaskSchema,
    domainStatsFiltersSchema,
    reviewFiltersSchema,
    taskFiltersSchema,
    taskIdParamsSchema,
    trendFiltersSchema,
    updateTaskSchema,
} from '@vdp/shared';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import {
    carryOverResponse,
    paginatedCollection,
    sendCreated,
    sendMessage,
} from '../../../common/http/responses';
import { ServiceResolver } from '../../../common/http/ServiceResolver';
import { assertFound } from '../../../common/http/errors';
import { RouteContextHandler } from '../../../common/http/routes';
import { parseBody, parseParams } from '../../../common/http/validation';

// Services
import { GetTasks } from '../../services/GetTasks';
import { GetTask } from '../../services/GetTask';
import { CreateTask } from '../../services/CreateTask';
import { UpdateTask } from '../../services/UpdateTask';
import { DeleteTask } from '../../services/DeleteTask';
import { CompleteTask } from '../../services/CompleteTask';
import { CarryOverTask } from '../../services/CarryOverTask';
import { DiscardTask } from '../../services/DiscardTask';
import { CarryOverAllPending } from '../../services/CarryOverAllPending';
import { GetEndOfDayReview } from '../../services/GetEndOfDayReview';
import { AddTaskNote } from '../../services/AddTaskNote';
import { GetDayStats } from '../../services/GetDayStats';
import { GetCompletionByDomain } from '../../services/GetCompletionByDomain';
import { GetCarryOverRate } from '../../services/GetCarryOverRate';

type TaskFilters = z.input<typeof taskFiltersSchema>;
type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
type CreateTaskBody = z.input<typeof createTaskSchema>;
type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
type CarryOverAllBody = z.infer<typeof carryOverAllSchema>;
type CreateTaskNoteBody = z.input<typeof createTaskNoteSchema>;
type ReviewFilters = z.infer<typeof reviewFiltersSchema>;
type TrendFilters = z.input<typeof trendFiltersSchema>;
type DomainStatsFilters = z.infer<typeof domainStatsFiltersSchema>;

export class TasksController extends HttpController {
    readonly prefix = '/api/v1/tasks';

    constructor(private services: ServiceResolver) {
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
            .post('/:id/complete', { params: taskIdParamsSchema }, this.completeTask)
            .post('/:id/carry-over', this.carryOverTask)
            .post('/:id/discard', { params: taskIdParamsSchema }, this.discardTask)
            .post('/carry-over-all', { body: carryOverAllSchema }, this.carryOverAllPending);
    }

    private registerNoteRoutes(routes: RouteRegister): void {
        routes
            .get('/:id/notes', { params: taskIdParamsSchema }, this.getTaskNotes)
            .post('/:id/notes', { params: taskIdParamsSchema, body: createTaskNoteSchema }, this.addTaskNote);
    }

    private registerReviewRoutes(routes: RouteRegister): void {
        routes.get('/review', { query: reviewFiltersSchema }, this.getReview);
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
        const userId = request.auth.userId!;
        const result = await this.services.get(GetTasks).execute(userId, query!);
        return reply.send(paginatedCollection('tasks', result.tasks, result));
    };

    private readonly getTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const task = assertFound(
            await this.services.get(GetTask).executeWithNotes(userId, params!.id),
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
        const userId = request.auth.userId!;
        const result = await this.services.get(CreateTask).execute(userId, body!, query?.checkDuplicates);
        return sendCreated(reply, result);
    };

    private readonly updateTask: RouteContextHandler<TaskIdParams, undefined, UpdateTaskBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const updated = assertFound(
            await this.services.get(UpdateTask).execute(userId, params!.id, body!),
            'Task not found',
        );
        return reply.send(updated);
    };

    private readonly deleteTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        assertFound(await this.services.get(DeleteTask).execute(userId, params!.id), 'Task not found');
        return sendMessage(reply, 'Task deleted');
    };

    private readonly completeTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const completed = assertFound(
            await this.services.get(CompleteTask).execute(userId, params!.id),
            'Task not found',
        );
        return reply.send(completed);
    };

    private readonly carryOverTask = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = request.auth.userId!;
        const params = parseParams(taskIdParamsSchema, request.params);
        const body = parseBody(carryOverSchema, request.body ?? {});
        const carried = assertFound(
            await this.services.get(CarryOverTask).execute(userId, params.id, body.toDate),
            'Task not found',
        );
        return reply.send(carried);
    };

    private readonly discardTask: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const discarded = assertFound(
            await this.services.get(DiscardTask).execute(userId, params!.id),
            'Task not found',
        );
        return reply.send(discarded);
    };

    private readonly carryOverAllPending: RouteContextHandler<undefined, undefined, CarryOverAllBody> = async ({
        request,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const results = await this.services.get(CarryOverAllPending).execute(userId, body!.fromDate, body!.toDate);
        return reply.send(carryOverResponse(results));
    };

    private readonly getTaskNotes: RouteContextHandler<TaskIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = assertFound(
            await this.services.get(GetTask).executeWithNotes(userId, params!.id),
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
        const userId = request.auth.userId!;
        const note = await this.services.get(AddTaskNote).execute(userId, params!.id, body!.content, body!.type);
        return sendCreated(reply, note);
    };

    private readonly getReview: RouteContextHandler<undefined, ReviewFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(GetEndOfDayReview).execute(userId, query!.date);
        return reply.send(result);
    };

    private readonly getTodayStats = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(GetDayStats).executeToday(userId);
        return reply.send(result);
    };

    private readonly getTrendStats: RouteContextHandler<undefined, TrendFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(GetDayStats).executeTrend(userId, query!.days);
        return reply.send(result);
    };

    private readonly getStatsByDomain: RouteContextHandler<undefined, DomainStatsFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(GetCompletionByDomain).execute(userId, query!.from, query!.to);
        return reply.send(result);
    };

    private readonly getCarryOverRate: RouteContextHandler<undefined, TrendFilters, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(GetCarryOverRate).execute(userId, query!.days);
        return reply.send(result);
    };
}
