import { localDateStringSchema, type HealthAgentToolName } from '@vdp/shared';

import { AgentTool } from '../../../common/base/agents/BaseAgent';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { CompleteHabitDay } from '../../services/CompleteHabitDay';
import { CreateHabit } from '../../services/CreateHabit';
import { GetHabitsOverview } from '../../services/GetHabitsOverview';

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
        services: ServiceProvider,
        authContextStorage: AuthContextStorage,
    ): AgentTool[] {
        const userId = () => authContextStorage.getAuthContext().userId!;

        return [
            jsonTool({
                name: 'list_habits',
                description:
                    'List the user\'s active habits with today\'s completion state, current streak, ' +
                    'and best streak. Call this before completing or discussing habits.',
                inputSchema: { type: 'object', properties: {}, required: [] },
                execute: async () => services.get(GetHabitsOverview).execute(userId()),
            }),
            jsonTool({
                name: 'create_habit',
                description: 'Create a new daily habit. Keep names short and concrete.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Habit name, e.g. "Gimnasio"' },
                        emoji: { type: 'string', description: 'Optional emoji for the habit' },
                    },
                    required: ['name'],
                },
                execute: async (input) => {
                    const name = typeof input.name === 'string' ? input.name.trim() : '';
                    if (!name) return { error: 'Habit name is required' };

                    const habit = await services.get(CreateHabit).execute(userId(), {
                        name,
                        emoji: typeof input.emoji === 'string' ? input.emoji : null,
                    });
                    return habit.toSnapshot();
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

                    return services.get(CompleteHabitDay).execute(
                        userId(),
                        input.habitId,
                        typeof input.date === 'string' ? input.date : undefined,
                    );
                },
            }),
        ];
    }
}
