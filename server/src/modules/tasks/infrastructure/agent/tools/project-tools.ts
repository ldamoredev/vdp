import { CQBus } from '@nbottarini/cqbus';

import { executionContextFromAuth } from '../../../../common/app/auth/AuthExecutionContext';
import { AuthContextStorage } from '../../../../common/http/AuthContextStorage';
import { GetProjectQuery } from '../../../../projects/app/GetProjectQuery';
import { CreateTaskCommand } from '../../../app/CreateTaskCommand';
import { GetTasksQuery } from '../../../app/GetTasksQuery';
import { TASK_PRIORITIES, jsonTool } from './shared';

// Upper bound of the 3–8 breakdown rule: a batch larger than this makes the
// single confirmation meaningless and floods the board.
const MAX_BREAKDOWN_TASKS = 8;

export function createProjectBreakdownTools(bus: CQBus, authContextStorage: AuthContextStorage) {
    const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

    return [
        jsonTool({
            name: 'get_project_context',
            description:
                'Read an existing project before proposing a task breakdown. Returns its direction (outcome, next action, ' +
                'focus, kind, client) and the tasks already on its board, so the proposal does not duplicate what exists. ' +
                'Always call this before create_project_tasks.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectId: { type: 'string', description: 'ID of the existing project to break down' },
                },
                required: ['projectId'],
            },
            execute: async (input) => {
                const project = await bus.execute(new GetProjectQuery(input.projectId), executionContext());
                if (!project) return { error: 'Project not found' };

                const existing = await bus.execute(new GetTasksQuery({ projectId: project.id }), executionContext());

                return {
                    project: {
                        id: project.id,
                        kind: project.kind,
                        outcome: project.outcome,
                        nextAction: project.nextAction,
                        focus: project.focus,
                        client: project.client,
                    },
                    existingTasks: existing.tasks.map((task) => ({
                        title: task.title,
                        status: task.status,
                        boardStatus: task.boardStatus,
                    })),
                };
            },
        }),
        jsonTool({
            name: 'create_project_tasks',
            description:
                'Create a batch of tasks on an existing project board (backlog column). ' +
                'Only call this AFTER the user explicitly confirms the proposed list — never on your own initiative. ' +
                'Accepts between 1 and 8 task drafts. Each task is checked for duplicates and the response flags any ' +
                'similar existing tasks. Returns the created tasks.',
            inputSchema: {
                type: 'object',
                properties: {
                    projectId: { type: 'string', description: 'ID of the existing project to assign the tasks to' },
                    tasks: {
                        type: 'array',
                        description: 'Between 1 and 8 task drafts to create in the project backlog',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string', description: 'Task title — a concrete, board-ready action' },
                                priority: {
                                    type: 'number',
                                    enum: TASK_PRIORITIES,
                                    description: 'Priority: 1=low, 2=medium, 3=high. Default: 2',
                                },
                            },
                            required: ['title'],
                        },
                    },
                },
                required: ['projectId', 'tasks'],
            },
            execute: async (input) => {
                const drafts = input.tasks;
                if (!Array.isArray(drafts) || drafts.length === 0) {
                    return { error: 'Provide between 1 and 8 task drafts.' };
                }
                if (drafts.length > MAX_BREAKDOWN_TASKS) {
                    return {
                        error: `Too many tasks (${drafts.length}). Propose at most ${MAX_BREAKDOWN_TASKS} and narrow the list.`,
                    };
                }
                if (drafts.some((draft) => typeof draft?.title !== 'string' || draft.title.trim() === '')) {
                    return { error: 'Every task needs a non-empty title.' };
                }

                // Validate ownership up front so a bad or foreign project id creates nothing (no partial writes).
                const project = await bus.execute(new GetProjectQuery(input.projectId), executionContext());
                if (!project) return { error: 'Project not found' };

                const created: Record<string, unknown>[] = [];
                for (const draft of drafts) {
                    const result = await bus.execute(
                        new CreateTaskCommand(
                            {
                                title: draft.title,
                                priority: draft.priority,
                                projectId: project.id,
                                boardStatus: 'backlog',
                            },
                            true,
                        ),
                        executionContext(),
                    );

                    const entry: Record<string, unknown> = { ...result.task };
                    if (result.similarTasks && result.similarTasks.length > 0) {
                        entry.similarTasks = result.similarTasks.map((t) => ({
                            content: t.content,
                            matchPercent: t.matchPercent,
                        }));
                    }
                    created.push(entry);
                }

                return { count: created.length, created };
            },
        }),
    ];
}
