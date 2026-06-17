import { CQBus } from '@nbottarini/cqbus';
import { localDateStringSchema, type HealthAgentToolName } from '@vdp/shared';

import { AgentTool } from '../../../common/base/agents/BaseAgent';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { CompleteGoalCommand } from '../../app/CompleteGoalCommand';
import { CompleteHabitDayCommand } from '../../app/CompleteHabitDayCommand';
import { CreateCounterCommand } from '../../app/CreateCounterCommand';
import { CreateGoalCommand } from '../../app/CreateGoalCommand';
import { CreateHabitCommand } from '../../app/CreateHabitCommand';
import { GetCountersOverviewQuery } from '../../app/GetCountersOverviewQuery';
import { GetGoalsOverviewQuery } from '../../app/GetGoalsOverviewQuery';
import { GetHabitsOverviewQuery } from '../../app/GetHabitsOverviewQuery';
import { RelapseCounterCommand } from '../../app/RelapseCounterCommand';

type ToolInput = Record<string, unknown>;

type JsonToolDefinition = {
    name: HealthAgentToolName;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: ToolInput) => Promise<unknown> | unknown;
};

function jsonTool(definition: JsonToolDefinition): AgentTool {
    return {
        name: definition.name,
        description: definition.description,
        inputSchema: definition.inputSchema,
        execute: async (input) => JSON.stringify(await definition.execute(input)),
    };
}

export class HealthTools {
    static createHealthTools(
        bus: CQBus,
        authContextStorage: AuthContextStorage,
    ): AgentTool[] {
        const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

        return [
            jsonTool({
                name: 'list_habits',
                description:
                    'List the user\'s active habits with today\'s completion state, cadence progress, ' +
                    'current streak, and best streak. Call this before completing or discussing habits.',
                inputSchema: { type: 'object', properties: {}, required: [] },
                execute: async () => bus.execute(new GetHabitsOverviewQuery(), executionContext()),
            }),
            jsonTool({
                name: 'create_habit',
                description:
                    'Create a new habit. cadence can be daily or weekly; weekly habits require ' +
                    'weeklyTarget from 1 to 7. Keep names short and concrete.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Habit name, e.g. "Gimnasio"' },
                        emoji: { type: 'string', description: 'Optional emoji for the habit' },
                        cadence: { type: 'string', enum: ['daily', 'weekly'], description: 'daily or weekly' },
                        weeklyTarget: { type: 'number', description: 'Required for weekly habits: times per week, 1-7' },
                    },
                    required: ['name'],
                },
                execute: async (input) => {
                    const name = typeof input.name === 'string' ? input.name.trim() : '';
                    if (!name) return { error: 'Habit name is required' };
                    const cadence = input.cadence === 'weekly' ? 'weekly' : 'daily';
                    const weeklyTarget = input.weeklyTarget;
                    if (input.cadence !== undefined && input.cadence !== 'daily' && input.cadence !== 'weekly') {
                        return { error: 'cadence must be "daily" or "weekly"' };
                    }
                    if (cadence === 'weekly'
                        && (typeof weeklyTarget !== 'number'
                            || !Number.isInteger(weeklyTarget)
                            || weeklyTarget < 1
                            || weeklyTarget > 7)) {
                        return { error: 'weeklyTarget must be an integer between 1 and 7' };
                    }

                    return bus.execute(new CreateHabitCommand({
                        name,
                        emoji: typeof input.emoji === 'string' ? input.emoji : null,
                        cadence,
                        weeklyTarget: cadence === 'weekly' ? weeklyTarget as number : null,
                    }), executionContext());
                },
            }),
            jsonTool({
                name: 'complete_habit',
                description:
                    'Mark a habit as done for today (or a past YYYY-MM-DD date). ' +
                    'Use list_habits first to get the habitId.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        habitId: { type: 'string', description: 'Habit ID' },
                        date: { type: 'string', description: 'Optional YYYY-MM-DD date, defaults to today' },
                    },
                    required: ['habitId'],
                },
                execute: async (input) => {
                    if (typeof input.habitId !== 'string') return { error: 'habitId is required' };
                    if (input.date !== undefined && input.date !== null
                        && !localDateStringSchema.safeParse(input.date).success) {
                        return { error: `Invalid date: expected YYYY-MM-DD, got ${JSON.stringify(input.date)}` };
                    }

                    return bus.execute(
                        new CompleteHabitDayCommand(input.habitId, typeof input.date === 'string' ? input.date : undefined),
                        executionContext(),
                    );
                },
            }),
            jsonTool({
                name: 'list_counters',
                description:
                    'List the user\'s "days since" counters (e.g. days without smoking) with current ' +
                    'days, best attempt, and estimated money not spent. Call this before relapsing or ' +
                    'discussing a counter.',
                inputSchema: { type: 'object', properties: {}, required: [] },
                execute: async () => bus.execute(new GetCountersOverviewQuery(), executionContext()),
            }),
            jsonTool({
                name: 'create_counter',
                description:
                    'Create a "days since" counter (e.g. "Sin fumar"). startedAt accepts a past ' +
                    'YYYY-MM-DD date for things quit a while ago; dailyCost (ARS, decimal string) ' +
                    'enables the money-not-spent estimate.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Counter name, e.g. "Sin fumar"' },
                        emoji: { type: 'string', description: 'Optional emoji' },
                        dailyCost: { type: 'string', description: 'Optional estimated daily cost in ARS, e.g. "4500.00"' },
                        startedAt: { type: 'string', description: 'Optional YYYY-MM-DD start date, defaults to today' },
                    },
                    required: ['name'],
                },
                execute: async (input) => {
                    const name = typeof input.name === 'string' ? input.name.trim() : '';
                    if (!name) return { error: 'Counter name is required' };
                    if (input.startedAt !== undefined && input.startedAt !== null
                        && !localDateStringSchema.safeParse(input.startedAt).success) {
                        return { error: `Invalid startedAt: expected YYYY-MM-DD, got ${JSON.stringify(input.startedAt)}` };
                    }

                    return bus.execute(new CreateCounterCommand({
                        name,
                        emoji: typeof input.emoji === 'string' ? input.emoji : null,
                        dailyCost: typeof input.dailyCost === 'string' ? input.dailyCost : null,
                        startedAt: typeof input.startedAt === 'string' ? input.startedAt : undefined,
                    }), executionContext());
                },
            }),
            jsonTool({
                name: 'relapse_counter',
                description:
                    'Register a relapse on a counter: closes the current attempt into the history ' +
                    'and restarts from the relapse date. Use list_counters first to get the counterId. ' +
                    'Be matter-of-fact about it — the useful datum is restarting, not the guilt.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        counterId: { type: 'string', description: 'Counter ID' },
                        date: { type: 'string', description: 'Optional YYYY-MM-DD relapse date, defaults to today' },
                    },
                    required: ['counterId'],
                },
                execute: async (input) => {
                    if (typeof input.counterId !== 'string') return { error: 'counterId is required' };
                    if (input.date !== undefined && input.date !== null
                        && !localDateStringSchema.safeParse(input.date).success) {
                        return { error: `Invalid date: expected YYYY-MM-DD, got ${JSON.stringify(input.date)}` };
                    }

                    return bus.execute(
                        new RelapseCounterCommand(input.counterId, typeof input.date === 'string' ? input.date : undefined),
                        executionContext(),
                    );
                },
            }),
            jsonTool({
                name: 'list_goals',
                description:
                    'List the user\'s goals with target dates, status, and days left ' +
                    '(negative = overdue). Call this before completing or discussing goals.',
                inputSchema: { type: 'object', properties: {}, required: [] },
                execute: async () => bus.execute(new GetGoalsOverviewQuery(), executionContext()),
            }),
            jsonTool({
                name: 'create_goal',
                description:
                    'Create a goal with a deadline (e.g. "Empezar el gym" antes del 2026-07-01). ' +
                    'targetDate must be a future YYYY-MM-DD date.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Goal title, short and concrete' },
                        targetDate: { type: 'string', description: 'Deadline, YYYY-MM-DD, in the future' },
                        notes: { type: 'string', description: 'Optional context notes' },
                    },
                    required: ['title', 'targetDate'],
                },
                execute: async (input) => {
                    const title = typeof input.title === 'string' ? input.title.trim() : '';
                    if (!title) return { error: 'Goal title is required' };
                    if (!localDateStringSchema.safeParse(input.targetDate).success) {
                        return { error: `Invalid targetDate: expected YYYY-MM-DD, got ${JSON.stringify(input.targetDate)}` };
                    }

                    return bus.execute(new CreateGoalCommand({
                        title,
                        targetDate: input.targetDate as string,
                        notes: typeof input.notes === 'string' ? input.notes : null,
                    }), executionContext());
                },
            }),
            jsonTool({
                name: 'complete_goal',
                description:
                    'Mark a goal as done. Use list_goals first to get the goalId. After completing, ' +
                    'offer to turn the goal into a habit (use create_habit if the user accepts; weekly ' +
                    'cadence is often right for gym/sport habits).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        goalId: { type: 'string', description: 'Goal ID' },
                    },
                    required: ['goalId'],
                },
                execute: async (input) => {
                    if (typeof input.goalId !== 'string') return { error: 'goalId is required' };
                    return bus.execute(new CompleteGoalCommand(input.goalId), executionContext());
                },
            }),
        ];
    }
}
