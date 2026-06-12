import {
    counterRelapseSchema,
    createCounterSchema,
    createHabitSchema,
    habitIdParamsSchema,
    habitLogSchema,
} from '@vdp/shared';
import { z } from 'zod';

import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { sendCreated } from '../../../common/http/responses';
import { ServiceResolver } from '../../../common/http/ServiceResolver';
import { RouteContextHandler } from '../../../common/http/routes';

import { ArchiveHabit } from '../../services/ArchiveHabit';
import { CompleteHabitDay } from '../../services/CompleteHabitDay';
import { CreateHabit } from '../../services/CreateHabit';
import { GetHabitsOverview } from '../../services/GetHabitsOverview';
import { UncompleteHabitDay } from '../../services/UncompleteHabitDay';
import { ArchiveCounter } from '../../services/ArchiveCounter';
import { CreateCounter } from '../../services/CreateCounter';
import { GetCountersOverview } from '../../services/GetCountersOverview';
import { RelapseCounter } from '../../services/RelapseCounter';

type HabitIdParams = z.infer<typeof habitIdParamsSchema>;
type CreateHabitBody = z.input<typeof createHabitSchema>;
type HabitLogBody = z.infer<typeof habitLogSchema>;
type CreateCounterBody = z.input<typeof createCounterSchema>;
type CounterRelapseBody = z.infer<typeof counterRelapseSchema>;

export class HealthController extends HttpController {
    readonly prefix = '/api/v1/health';

    constructor(private services: ServiceResolver) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/habits', {}, this.listHabits)
            .post('/habits', { body: createHabitSchema }, this.createHabit)
            .post('/habits/:id/complete', { params: habitIdParamsSchema, body: habitLogSchema.default({}) }, this.completeHabit)
            .post('/habits/:id/uncomplete', { params: habitIdParamsSchema, body: habitLogSchema.default({}) }, this.uncompleteHabit)
            .post('/habits/:id/archive', { params: habitIdParamsSchema }, this.archiveHabit)
            .get('/counters', {}, this.listCounters)
            .post('/counters', { body: createCounterSchema }, this.createCounter)
            .post('/counters/:id/relapse', { params: habitIdParamsSchema, body: counterRelapseSchema.default({}) }, this.relapseCounter)
            .post('/counters/:id/archive', { params: habitIdParamsSchema }, this.archiveCounter);
    }

    private readonly listCounters: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const userId = request.auth.userId!;
        return reply.send(await this.services.get(GetCountersOverview).execute(userId));
    };

    private readonly createCounter: RouteContextHandler<undefined, undefined, CreateCounterBody> = async ({
        request,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const counter = await this.services.get(CreateCounter).execute(userId, body!);
        const row = await this.services.get(GetCountersOverview).buildRow(userId, counter);
        return sendCreated(reply, row);
    };

    private readonly relapseCounter: RouteContextHandler<HabitIdParams, undefined, CounterRelapseBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const counter = await this.services.get(RelapseCounter).execute(userId, params!.id, body?.date);
        const row = await this.services.get(GetCountersOverview).buildRow(userId, counter);
        return reply.send(row);
    };

    private readonly archiveCounter: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const counter = await this.services.get(ArchiveCounter).execute(userId, params!.id);
        return reply.send(counter.toSnapshot());
    };

    private readonly listHabits: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const userId = request.auth.userId!;
        return reply.send(await this.services.get(GetHabitsOverview).execute(userId));
    };

    private readonly createHabit: RouteContextHandler<undefined, undefined, CreateHabitBody> = async ({
        request,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const habit = await this.services.get(CreateHabit).execute(userId, body!);
        const row = await this.services.get(GetHabitsOverview).buildRow(userId, habit);
        return sendCreated(reply, row);
    };

    private readonly completeHabit: RouteContextHandler<HabitIdParams, undefined, HabitLogBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(CompleteHabitDay).execute(userId, params!.id, body?.date);
        return reply.send(result);
    };

    private readonly uncompleteHabit: RouteContextHandler<HabitIdParams, undefined, HabitLogBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(UncompleteHabitDay).execute(userId, params!.id, body?.date);
        return reply.send(result);
    };

    private readonly archiveHabit: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const habit = await this.services.get(ArchiveHabit).execute(userId, params!.id);
        return reply.send(habit.toSnapshot());
    };
}
