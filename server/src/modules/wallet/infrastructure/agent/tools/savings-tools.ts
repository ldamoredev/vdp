import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { GetSavingsGoals } from '../../../services/GetSavingsGoals';
import { CreateSavingsGoal } from '../../../services/CreateSavingsGoal';
import { UpdateSavingsGoal } from '../../../services/UpdateSavingsGoal';
import { ContributeSavings } from '../../../services/ContributeSavings';
import { CURRENCIES, jsonTool } from './shared';

export function createSavingsTools(services: ServiceProvider) {
    return [
        jsonTool({
            name: 'list_savings_goals',
            description:
                'List all savings goals with target amount, current progress, deadline, and completion status.',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
            execute: async () => services.get(GetSavingsGoals).execute(),
        }),
        jsonTool({
            name: 'create_savings_goal',
            description:
                'Create a new savings goal. Returns the created goal with its current saved amount.',
            inputSchema: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Goal name (e.g., "Emergency fund")' },
                    targetAmount: { type: 'string', description: 'Target amount as a positive number string' },
                    currency: { type: 'string', enum: CURRENCIES, description: 'Currency: ARS or USD' },
                    deadline: {
                        type: ['string', 'null'],
                        description: 'Optional deadline (YYYY-MM-DD). Use null or omit if there is no deadline.',
                    },
                },
                required: ['name', 'targetAmount', 'currency'],
            },
            execute: async (input) =>
                services.get(CreateSavingsGoal).execute({
                    name: input.name,
                    targetAmount: input.targetAmount,
                    currency: input.currency,
                    deadline: input.deadline ?? null,
                }),
        }),
        jsonTool({
            name: 'update_savings_goal',
            description:
                'Update an existing savings goal. Use this to rename it, change the target, currency, or deadline.',
            inputSchema: {
                type: 'object',
                properties: {
                    goalId: { type: 'string', description: 'Savings goal ID' },
                    name: { type: 'string', description: 'Updated goal name' },
                    targetAmount: { type: 'string', description: 'Updated target amount' },
                    currency: { type: 'string', enum: CURRENCIES, description: 'Updated currency' },
                    deadline: {
                        type: ['string', 'null'],
                        description: 'Updated deadline (YYYY-MM-DD). Use null or omit if there is no deadline.',
                    },
                },
                required: ['goalId'],
            },
            execute: async (input) => {
                const goal = await services.get(UpdateSavingsGoal).execute(input.goalId, {
                    name: input.name,
                    targetAmount: input.targetAmount,
                    currency: input.currency,
                    deadline: 'deadline' in input ? input.deadline : undefined,
                });
                return goal ?? { error: 'Savings goal not found' };
            },
        }),
        jsonTool({
            name: 'contribute_savings',
            description:
                'Add money to an existing savings goal. Returns the updated goal with new progress totals.',
            inputSchema: {
                type: 'object',
                properties: {
                    goalId: { type: 'string', description: 'Savings goal ID' },
                    amount: { type: 'string', description: 'Contribution amount as a positive number string' },
                    date: { type: 'string', description: 'Optional contribution date (YYYY-MM-DD). Defaults to today.' },
                    note: { type: 'string', description: 'Optional note about the contribution' },
                    transactionId: { type: 'string', description: 'Optional related wallet transaction ID' },
                },
                required: ['goalId', 'amount'],
            },
            execute: async (input) => {
                const goal = await services.get(ContributeSavings).execute({
                    goalId: input.goalId,
                    amount: input.amount,
                    date: input.date,
                    note: input.note ?? null,
                    transactionId: input.transactionId ?? null,
                });
                return goal ?? { error: 'Savings goal not found' };
            },
        }),
    ];
}
