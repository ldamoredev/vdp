import { CQBus } from '@nbottarini/cqbus';
import { localDateStringSchema, type ProjectsAgentToolName } from '@vdp/shared';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { AgentTool } from '../../../common/base/agents/BaseAgent';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { GetTasksQuery } from '../../../tasks/app/GetTasksQuery';
import type { Task, TaskBoardStatus } from '../../../tasks/domain/Task';
import { GetProjectHoursReportQuery } from '../../app/GetProjectHoursReportQuery';
import { GetProjectQuery } from '../../app/GetProjectQuery';
import { ListProjectsQuery } from '../../app/ListProjectsQuery';
import { ListTimeEntriesQuery } from '../../app/ListTimeEntriesQuery';
import type { ProjectKind, ProjectStatus } from '../../domain/Project';

type ToolInput = Record<string, unknown>;

type JsonToolDefinition = {
    name: ProjectsAgentToolName;
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

export class ProjectsTools {
    static createProjectsTools(bus: CQBus, authContextStorage: AuthContextStorage): AgentTool[] {
        const executionContext = () => executionContextFromAuth(authContextStorage.getAuthContext());

        return [
            jsonTool({
                name: 'list_projects',
                description:
                    'List the user\'s project direction records. Defaults to active projects; filter by lifecycle or kind. ' +
                    'Use this before choosing or comparing projects.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['active', 'archived', 'all'],
                            description: 'Project lifecycle filter; defaults to active',
                        },
                        kind: {
                            type: 'string',
                            enum: ['work', 'personal'],
                            description: 'Optional project kind filter',
                        },
                    },
                    required: [],
                },
                execute: async (input) => {
                    const projects = await bus.execute(new ListProjectsQuery(), executionContext());
                    const status = projectStatusFilter(input.status);
                    const kind = projectKindFilter(input.kind);
                    return {
                        projects: projects
                            .filter((project) => status === 'all' || project.status === status)
                            .filter((project) => kind === null || project.kind === kind)
                            .map((project) => project.toSnapshot()),
                    };
                },
            }),
            jsonTool({
                name: 'get_project_board',
                description:
                    'Read one project\'s direction and all Tasks already assigned to its board, grouped by board column. ' +
                    'Use list_projects first when the project is ambiguous.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectId: { type: 'string', description: 'Project ID owned by the current user' },
                    },
                    required: ['projectId'],
                },
                execute: async (input) => {
                    if (typeof input.projectId !== 'string' || !input.projectId.trim()) {
                        return { error: 'projectId is required' };
                    }
                    const project = await bus.execute(new GetProjectQuery(input.projectId), executionContext());
                    if (!project) return { error: 'Project not found' };

                    const { tasks } = await bus.execute(
                        new GetTasksQuery({ projectId: project.id, limit: 200 }),
                        executionContext(),
                    );
                    return {
                        project: project.toSnapshot(),
                        board: groupTasksByBoardStatus(tasks),
                    };
                },
            }),
            jsonTool({
                name: 'list_project_time_entries',
                description:
                    'List time entries in an explicit inclusive YYYY-MM-DD range, optionally for one project. ' +
                    'Returns each entry with its project outcome for evidence-backed progress review.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fromDate: { type: 'string', description: 'Inclusive start date, YYYY-MM-DD' },
                        toDate: { type: 'string', description: 'Inclusive end date, YYYY-MM-DD' },
                        projectId: { type: 'string', description: 'Optional project ID' },
                    },
                    required: ['fromDate', 'toDate'],
                },
                execute: async (input) => {
                    const rangeError = validateDateRange(input.fromDate, input.toDate);
                    if (rangeError) return { error: rangeError };
                    const projectId = typeof input.projectId === 'string' && input.projectId.trim()
                        ? input.projectId
                        : undefined;
                    const projects = await bus.execute(new ListProjectsQuery(), executionContext());
                    const projectById = new Map(projects.map((project) => [project.id, project]));
                    if (projectId && !projectById.has(projectId)) return { error: 'Project not found' };

                    const entries = await bus.execute(
                        new ListTimeEntriesQuery({
                            fromDate: input.fromDate as string,
                            toDate: input.toDate as string,
                            projectId,
                        }),
                        executionContext(),
                    );
                    return {
                        fromDate: input.fromDate,
                        toDate: input.toDate,
                        entries: entries.flatMap((entry) => {
                            const project = projectById.get(entry.projectId);
                            return project
                                ? [{ ...entry.toSnapshot(), projectOutcome: project.outcome }]
                                : [];
                        }),
                    };
                },
            }),
            jsonTool({
                name: 'get_project_hours_report',
                description:
                    'Get the aggregated project hours report for an explicit inclusive YYYY-MM-DD range. ' +
                    'Can filter by project or client and keeps expected-income totals separate by currency.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fromDate: { type: 'string', description: 'Inclusive start date, YYYY-MM-DD' },
                        toDate: { type: 'string', description: 'Inclusive end date, YYYY-MM-DD' },
                        projectId: { type: 'string', description: 'Optional project ID' },
                        clientId: { type: 'string', description: 'Optional client ID' },
                    },
                    required: ['fromDate', 'toDate'],
                },
                execute: async (input) => {
                    const rangeError = validateDateRange(input.fromDate, input.toDate);
                    if (rangeError) return { error: rangeError };
                    return bus.execute(
                        new GetProjectHoursReportQuery({
                            fromDate: input.fromDate as string,
                            toDate: input.toDate as string,
                            projectId: optionalId(input.projectId),
                            clientId: optionalId(input.clientId),
                        }),
                        executionContext(),
                    );
                },
            }),
        ];
    }
}

function groupTasksByBoardStatus(tasks: Task[]): Record<TaskBoardStatus, ReturnType<Task['toSnapshot']>[]> {
    return {
        backlog: tasks.filter((task) => task.boardStatus === 'backlog').map((task) => task.toSnapshot()),
        next: tasks.filter((task) => task.boardStatus === 'next').map((task) => task.toSnapshot()),
        doing: tasks.filter((task) => task.boardStatus === 'doing').map((task) => task.toSnapshot()),
        done: tasks.filter((task) => task.boardStatus === 'done').map((task) => task.toSnapshot()),
    };
}

function projectStatusFilter(value: unknown): ProjectStatus | 'all' {
    return value === 'archived' || value === 'all' ? value : 'active';
}

function projectKindFilter(value: unknown): ProjectKind | null {
    return value === 'work' || value === 'personal' ? value : null;
}

function validateDateRange(fromDate: unknown, toDate: unknown): string | null {
    if (!localDateStringSchema.safeParse(fromDate).success) {
        return `Invalid fromDate: expected YYYY-MM-DD, got ${JSON.stringify(fromDate)}`;
    }
    if (!localDateStringSchema.safeParse(toDate).success) {
        return `Invalid toDate: expected YYYY-MM-DD, got ${JSON.stringify(toDate)}`;
    }
    if ((fromDate as string) > (toDate as string)) return 'fromDate must be on or before toDate';
    return null;
}

function optionalId(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
}
