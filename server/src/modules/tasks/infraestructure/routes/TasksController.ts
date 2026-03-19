import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
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
import { Core } from '../../../Core';

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

export class TasksController {
    constructor(private app: FastifyInstance, private core: Core) {}

    plugin = (app: FastifyInstance, _opts: any, done: () => void) => {
        // CRUD
        app.get('/', this.listTasks.bind(this));
        app.get<IdParams>('/:id', this.getTask.bind(this));
        app.post('/', this.createTask.bind(this));
        app.put<IdParams>('/:id', this.updateTask.bind(this));
        app.delete<IdParams>('/:id', this.deleteTask.bind(this));

        // Status transitions
        app.post<IdParams>('/:id/complete', this.completeTask.bind(this));
        app.post<IdParams>('/:id/carry-over', this.carryOverTask.bind(this));
        app.post<IdParams>('/:id/discard', this.discardTask.bind(this));
        app.post('/carry-over-all', this.carryOverAllPending.bind(this));

        // Notes
        app.get<IdParams>('/:id/notes', this.listNotes.bind(this));
        app.post<IdParams>('/:id/notes', this.addNote.bind(this));

        // Review
        app.get('/review', this.getEndOfDayReview.bind(this));

        // Stats
        app.get('/stats/today', this.getTodayStats.bind(this));
        app.get('/stats/trend', this.getCompletionTrend.bind(this));
        app.get('/stats/by-domain', this.getCompletionByDomain.bind(this));
        app.get('/stats/carry-over', this.getCarryOverRate.bind(this));

        done();
    };

    // ─── CRUD ────────────────────────────────────────────

    private async listTasks(request: FastifyRequest, reply: FastifyReply) {
        try {
            const parsed = taskFiltersSchema.safeParse(request.query);
            if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
            const result = await this.core.getService(GetTasks).execute(parsed.data);
            return reply.send(result);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to fetch tasks' });
        }
    }

    private async getTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        try {
            const params = taskIdParamsSchema.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ error: params.error.flatten() });

            const task = await this.core.getService(GetTask).executeWithNotes(params.data.id);
            if (!task) return reply.status(404).send({ error: 'Task not found' });
            return reply.send(task);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to fetch task' });
        }
    }

    private async createTask(request: FastifyRequest, reply: FastifyReply) {
        try {
            const body = createTaskSchema.safeParse(request.body);
            if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

            const task = await this.core.getService(CreateTask).execute(body.data);
            return reply.status(201).send(task);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to create task' });
        }
    }

    private async updateTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        try {
            const params = taskIdParamsSchema.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ error: params.error.flatten() });

            const body = updateTaskSchema.safeParse(request.body);
            if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

            const updated = await this.core.getService(UpdateTask).execute(params.data.id, body.data);
            if (!updated) return reply.status(404).send({ error: 'Task not found' });
            return reply.send(updated);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to update task' });
        }
    }

    private async deleteTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        try {
            const params = taskIdParamsSchema.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ error: params.error.flatten() });

            const deleted = await this.core.getService(DeleteTask).execute(params.data.id);
            if (!deleted) return reply.status(404).send({ error: 'Task not found' });
            return reply.send({ message: 'Task deleted' });
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to delete task' });
        }
    }

    // ─── Status Transitions ──────────────────────────────

    private async completeTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        try {
            const params = taskIdParamsSchema.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ error: params.error.flatten() });

            const completed = await this.core.getService(CompleteTask).execute(params.data.id);
            if (!completed) return reply.status(404).send({ error: 'Task not found' });
            return reply.send(completed);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to complete task' });
        }
    }

    private async carryOverTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        try {
            const params = taskIdParamsSchema.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ error: params.error.flatten() });

            const body = carryOverSchema.safeParse(request.body ?? {});
            if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

            const carried = await this.core.getService(CarryOverTask).execute(params.data.id, body.data.toDate);
            if (!carried) return reply.status(404).send({ error: 'Task not found' });
            return reply.send(carried);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to carry over task' });
        }
    }

    private async discardTask(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        try {
            const params = taskIdParamsSchema.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ error: params.error.flatten() });

            const discarded = await this.core.getService(DiscardTask).execute(params.data.id);
            if (!discarded) return reply.status(404).send({ error: 'Task not found' });
            return reply.send(discarded);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to discard task' });
        }
    }

    private async carryOverAllPending(request: FastifyRequest, reply: FastifyReply) {
        try {
            const body = carryOverAllSchema.safeParse(request.body);
            if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

            const results = await this.core.getService(CarryOverAllPending).execute(body.data.fromDate, body.data.toDate);
            return reply.send({ carriedOver: results.length, tasks: results });
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to carry over tasks' });
        }
    }

    // ─── Notes ───────────────────────────────────────────

    private async listNotes(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        try {
            const params = taskIdParamsSchema.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ error: params.error.flatten() });

            const result = await this.core.getService(GetTask).executeWithNotes(params.data.id);
            if (!result) return reply.status(404).send({ error: 'Task not found' });
            return reply.send(result.notes);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to fetch notes' });
        }
    }

    private async addNote(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        try {
            const params = taskIdParamsSchema.safeParse(request.params);
            if (!params.success) return reply.status(400).send({ error: params.error.flatten() });

            const body = createTaskNoteSchema.safeParse(request.body);
            if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

            const note = await this.core.getService(AddTaskNote).execute(params.data.id, body.data.content);
            return reply.status(201).send(note);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to add note' });
        }
    }

    // ─── Review ──────────────────────────────────────────

    private async getEndOfDayReview(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = reviewFiltersSchema.safeParse(request.query);
            if (!query.success) return reply.status(400).send({ error: query.error.flatten() });

            const result = await this.core.getService(GetEndOfDayReview).execute(query.data.date);
            return reply.send(result);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to get review' });
        }
    }

    // ─── Stats ───────────────────────────────────────────

    private async getTodayStats(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const result = await this.core.getService(GetDayStats).executeToday();
            return reply.send(result);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to get stats' });
        }
    }

    private async getCompletionTrend(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = trendFiltersSchema.safeParse(request.query);
            if (!query.success) return reply.status(400).send({ error: query.error.flatten() });

            const result = await this.core.getService(GetDayStats).executeTrend(query.data.days);
            return reply.send(result);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to get trend' });
        }
    }

    private async getCompletionByDomain(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = domainStatsFiltersSchema.safeParse(request.query);
            if (!query.success) return reply.status(400).send({ error: query.error.flatten() });

            const result = await this.core.getService(GetCompletionByDomain).execute(query.data.from, query.data.to);
            return reply.send(result);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to get domain stats' });
        }
    }

    private async getCarryOverRate(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = trendFiltersSchema.safeParse(request.query);
            if (!query.success) return reply.status(400).send({ error: query.error.flatten() });

            const result = await this.core.getService(GetCarryOverRate).execute(query.data.days);
            return reply.send(result);
        } catch (err) {
            this.app.log.error(err);
            return reply.status(500).send({ error: 'Failed to get carry-over rate' });
        }
    }
}
