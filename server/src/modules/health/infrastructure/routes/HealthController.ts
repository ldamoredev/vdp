import {
    counterRelapseSchema,
    createCounterSchema,
    createGoalSchema,
    createHabitSchema,
    graduateGoalSchema,
    habitIdParamsSchema,
    habitLogSchema,
} from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';
import { z } from 'zod';

import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { sendCreated } from '../../../common/http/responses';
import { ServiceResolver } from '../../../common/http/ServiceResolver';
import { RouteContextHandler } from '../../../common/http/routes';

import { ArchiveHabit } from '../../services/ArchiveHabit';
import { CompleteHabitDay } from '../../services/CompleteHabitDay';
import { UncompleteHabitDay } from '../../services/UncompleteHabitDay';
import { ArchiveCounter } from '../../services/ArchiveCounter';
import { CreateCounter } from '../../services/CreateCounter';
import { GetCountersOverview } from '../../services/GetCountersOverview';
import { RelapseCounter } from '../../services/RelapseCounter';
import { CompleteGoal } from '../../services/CompleteGoal';
import { CreateGoal } from '../../services/CreateGoal';
import { DropGoal } from '../../services/DropGoal';
import { GetGoalsOverview } from '../../services/GetGoalsOverview';
import { GraduateGoal } from '../../services/GraduateGoal';
import { CreateHabitCommand } from '../../app/CreateHabitCommand';
import { GetHabitsOverviewQuery } from '../../app/GetHabitsOverviewQuery';

type HabitIdParams = z.infer<typeof habitIdParamsSchema>;
type CreateHabitBody = z.input<typeof createHabitSchema>;
type HabitLogBody = z.infer<typeof habitLogSchema>;
type CreateCounterBody = z.input<typeof createCounterSchema>;
type CounterRelapseBody = z.infer<typeof counterRelapseSchema>;
type CreateGoalBody = z.input<typeof createGoalSchema>;
type GraduateGoalBody = z.input<typeof graduateGoalSchema>;

export class HealthController extends HttpController {
    readonly prefix = '/api/v1/health';

    constructor(
        private readonly bus: CQBus,
        private services: ServiceResolver,
    ) {
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
            .post('/counters/:id/archive', { params: habitIdParamsSchema }, this.archiveCounter)
            .get('/goals', {}, this.listGoals)
            .post('/goals', { body: createGoalSchema }, this.createGoal)
            .post('/goals/:id/complete', { params: habitIdParamsSchema }, this.completeGoal)
            .post('/goals/:id/drop', { params: habitIdParamsSchema }, this.dropGoal)
            .post('/goals/:id/graduate', { params: habitIdParamsSchema, body: graduateGoalSchema }, this.graduateGoal);
    }

    private readonly listGoals: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const userId = request.auth.userId!;
        return reply.send(await this.services.get(GetGoalsOverview).execute(userId));
    };

    private readonly createGoal: RouteContextHandler<undefined, undefined, CreateGoalBody> = async ({
        request,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const goal = await this.services.get(CreateGoal).execute(userId, body!);
        return sendCreated(reply, this.services.get(GetGoalsOverview).buildRow(goal));
    };

    private readonly completeGoal: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const goal = await this.services.get(CompleteGoal).execute(userId, params!.id);
        return reply.send(this.services.get(GetGoalsOverview).buildRow(goal));
    };

    private readonly dropGoal: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const goal = await this.services.get(DropGoal).execute(userId, params!.id);
        return reply.send(this.services.get(GetGoalsOverview).buildRow(goal));
    };

    private readonly graduateGoal: RouteContextHandler<HabitIdParams, undefined, GraduateGoalBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(GraduateGoal).execute(userId, params!.id, body!);
        return reply.send({
            goal: this.services.get(GetGoalsOverview).buildRow(result.goal),
            habit: result.habit.toSnapshot(),
        });
    };

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

    private readonly listHabits: RouteContextHandler<undefined, undefined, undefined> = async ({ reply }) => {
        return reply.send(await this.bus.execute(new GetHabitsOverviewQuery()));
    };

    private readonly createHabit: RouteContextHandler<undefined, undefined, CreateHabitBody> = async ({
        body,
        reply,
    }) => {
        const row = await this.bus.execute(new CreateHabitCommand(body!));
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
