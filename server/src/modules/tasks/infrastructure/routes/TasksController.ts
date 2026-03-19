import { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
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
import { HttpController } from '../../../common/http/HttpController';
import {
    carryOverResponse,
    paginatedCollection,
    sendCreated,
    sendMessage,
} from '../../../common/http/responses';
import { ServiceResolver } from '../../../common/http/ServiceResolver';
import { assertFound } from '../../../common/http/errors';
import { parseBody, parseParams, parseQuery } from '../../../common/http/validation';

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

type IdParams = { Params: { id: string } };

export class TasksController implements HttpController {
    constructor(private services: ServiceResolver) {}

    register(app: FastifyInstance): void {
        const plugin: FastifyPluginCallback = (tasksApp, _opts, done) => {
            // CRUD
            tasksApp.get('/', this.listTasks.bind(this));
            tasksApp.get<IdParams>('/:id', this.getTask.bind(this));
            tasksApp.post('/', this.createTask.bind(this));
            tasksApp.put<IdParams>('/:id', this.updateTask.bind(this));
            tasksApp.delete<IdParams>('/:id', this.deleteTask.bind(this));

            // Status transitions
            tasksApp.post<IdParams>('/:id/complete', this.completeTask.bind(this));
            tasksApp.post<IdParams>('/:id/carry-over', this.carryOverTask.bind(this));
            tasksApp.post<IdParams>('/:id/discard', this.discardTask.bind(this));
            tasksApp.post('/carry-over-all', this.carryOverAllPending.bind(this));

            // Notes
            tasksApp.get<IdParams>('/:id/notes', this.listNotes.bind(this));
            tasksApp.post<IdParams>('/:id/notes', this.addNote.bind(this));

            // Review
            tasksApp.get('/review', this.getEndOfDayReview.bind(this));

            // Stats
            tasksApp.get('/stats/today', this.getTodayStats.bind(this));
            tasksApp.get('/stats/trend', this.getCompletionTrend.bind(this));
            tasksApp.get('/stats/by-domain', this.getCompletionByDomain.bind(this));
            tasksApp.get('/stats/carry-over', this.getCarryOverRate.bind(this));

            done();
        };

        app.register(plugin, { prefix: '/api/v1/tasks' });
    }

    // ─── CRUD ────────────────────────────────────────────

    private async listTasks(request: FastifyRequest, reply: FastifyReply) {
        const query = parseQuery(taskFiltersSchema, request.query);
        const result = await this.services.get(GetTasks).execute(query);
        return reply.send(paginatedCollection('tasks', result.tasks, result));
    }

    private async getTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(taskIdParamsSchema, request.params);
        const task = assertFound(
            await this.services.get(GetTask).executeWithNotes(params.id),
            'Task not found',
        );
        return reply.send(task);
    }

    private async createTask(request: FastifyRequest, reply: FastifyReply) {
        const body = parseBody(createTaskSchema, request.body);
        const task = await this.services.get(CreateTask).execute(body);
        return sendCreated(reply, task);
    }

    private async updateTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(taskIdParamsSchema, request.params);
        const body = parseBody(updateTaskSchema, request.body);
        const updated = assertFound(
            await this.services.get(UpdateTask).execute(params.id, body),
            'Task not found',
        );
        return reply.send(updated);
    }

    private async deleteTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(taskIdParamsSchema, request.params);
        assertFound(await this.services.get(DeleteTask).execute(params.id), 'Task not found');
        return sendMessage(reply, 'Task deleted');
    }

    // ─── Status Transitions ──────────────────────────────

    private async completeTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(taskIdParamsSchema, request.params);
        const completed = assertFound(
            await this.services.get(CompleteTask).execute(params.id),
            'Task not found',
        );
        return reply.send(completed);
    }

    private async carryOverTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(taskIdParamsSchema, request.params);
        const body = parseBody(carryOverSchema, request.body ?? {});
        const carried = assertFound(
            await this.services.get(CarryOverTask).execute(params.id, body.toDate),
            'Task not found',
        );
        return reply.send(carried);
    }

    private async discardTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(taskIdParamsSchema, request.params);
        const discarded = assertFound(
            await this.services.get(DiscardTask).execute(params.id),
            'Task not found',
        );
        return reply.send(discarded);
    }

    private async carryOverAllPending(request: FastifyRequest, reply: FastifyReply) {
        const body = parseBody(carryOverAllSchema, request.body);
        const results = await this.services.get(CarryOverAllPending).execute(body.fromDate, body.toDate);
        return reply.send(carryOverResponse(results));
    }

    // ─── Notes ───────────────────────────────────────────

    private async listNotes(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(taskIdParamsSchema, request.params);
        const result = assertFound(
            await this.services.get(GetTask).executeWithNotes(params.id),
            'Task not found',
        );
        return reply.send(result.notes);
    }

    private async addNote(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(taskIdParamsSchema, request.params);
        const body = parseBody(createTaskNoteSchema, request.body);
        const note = await this.services.get(AddTaskNote).execute(params.id, body.content);
        return sendCreated(reply, note);
    }

    // ─── Review ──────────────────────────────────────────

    private async getEndOfDayReview(request: FastifyRequest, reply: FastifyReply) {
        const query = parseQuery(reviewFiltersSchema, request.query);
        const result = await this.services.get(GetEndOfDayReview).execute(query.date);
        return reply.send(result);
    }

    // ─── Stats ───────────────────────────────────────────

    private async getTodayStats(_request: FastifyRequest, reply: FastifyReply) {
        const result = await this.services.get(GetDayStats).executeToday();
        return reply.send(result);
    }

    private async getCompletionTrend(request: FastifyRequest, reply: FastifyReply) {
        const query = parseQuery(trendFiltersSchema, request.query);
        const result = await this.services.get(GetDayStats).executeTrend(query.days);
        return reply.send(result);
    }

    private async getCompletionByDomain(request: FastifyRequest, reply: FastifyReply) {
        const query = parseQuery(domainStatsFiltersSchema, request.query);
        const result = await this.services.get(GetCompletionByDomain).execute(query.from, query.to);
        return reply.send(result);
    }

    private async getCarryOverRate(request: FastifyRequest, reply: FastifyReply) {
        const query = parseQuery(trendFiltersSchema, request.query);
        const result = await this.services.get(GetCarryOverRate).execute(query.days);
        return reply.send(result);
    }
}
