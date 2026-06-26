import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { ClientRepository } from '../domain/ClientRepository';
import { ProjectRepository } from '../domain/ProjectRepository';
import { TimeEntryRepository } from '../domain/TimeEntryRepository';

export type ProjectHoursReportFilters = {
    readonly fromDate: string;
    readonly toDate: string;
    readonly projectId?: string;
    readonly clientId?: string;
};

export type ProjectHoursReportRow = {
    readonly clientId: string | null;
    readonly clientName: string | null;
    readonly projectId: string;
    readonly projectOutcome: string;
    readonly weekStart: string;
    readonly minutes: number;
};

export type ProjectHoursReport = {
    readonly fromDate: string;
    readonly toDate: string;
    readonly totalMinutes: number;
    readonly rows: ProjectHoursReportRow[];
};

export class GetProjectHoursReportQuery extends Query<ProjectHoursReport> {
    constructor(readonly filters: ProjectHoursReportFilters) {
        super();
    }
}

export class GetProjectHoursReportQueryHandler
implements RequestHandler<GetProjectHoursReportQuery, ProjectHoursReport> {
    constructor(
        private readonly entries: TimeEntryRepository,
        private readonly projects: ProjectRepository,
        private readonly clients: ClientRepository,
    ) {}

    async handle(query: GetProjectHoursReportQuery, identity: Identity): Promise<ProjectHoursReport> {
        const { userId } = requireUserIdentity(identity);
        const entries = await this.entries.listTimeEntries(userId, query.filters);
        const projects = await this.projects.listProjects(userId);
        const clients = await this.clients.listClients(userId);
        const projectById = new Map(projects.map((project) => [project.id, project]));
        const clientById = new Map(clients.map((client) => [client.id, client]));
        const rowsByKey = new Map<string, ProjectHoursReportRow>();

        for (const entry of entries) {
            const project = projectById.get(entry.projectId);
            if (!project) continue;
            if (query.filters.clientId && project.clientId !== query.filters.clientId) continue;
            const client = project.clientId ? clientById.get(project.clientId) : null;
            const weekStart = startOfWeek(entry.date);
            const key = `${project.clientId ?? ''}:${project.id}:${weekStart}`;
            const current = rowsByKey.get(key);
            rowsByKey.set(key, {
                clientId: project.clientId,
                clientName: client?.name ?? project.client,
                projectId: project.id,
                projectOutcome: project.outcome,
                weekStart,
                minutes: (current?.minutes ?? 0) + entry.minutes,
            });
        }

        const rows = Array.from(rowsByKey.values())
            .sort((a, b) => b.weekStart.localeCompare(a.weekStart) || a.projectOutcome.localeCompare(b.projectOutcome));
        return {
            fromDate: query.filters.fromDate,
            toDate: query.filters.toDate,
            totalMinutes: rows.reduce((sum, row) => sum + row.minutes, 0),
            rows,
        };
    }
}

function startOfWeek(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    const local = new Date(year, month - 1, day);
    const mondayOffset = (local.getDay() + 6) % 7;
    local.setDate(local.getDate() - mondayOffset);
    return [
        local.getFullYear(),
        String(local.getMonth() + 1).padStart(2, '0'),
        String(local.getDate()).padStart(2, '0'),
    ].join('-');
}
