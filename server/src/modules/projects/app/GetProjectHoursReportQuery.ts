import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { ClientRepository } from '../domain/ClientRepository';
import { Project, type ProjectRateCurrency } from '../domain/Project';
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
    readonly expectedIncome: ProjectExpectedIncome | null;
};

export type ProjectExpectedIncome = {
    readonly amount: string;
    readonly currency: ProjectRateCurrency;
};

export type ProjectHoursReport = {
    readonly fromDate: string;
    readonly toDate: string;
    readonly totalMinutes: number;
    readonly incomeTotals: ProjectExpectedIncome[];
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
            const nextMinutes = (current?.minutes ?? 0) + entry.minutes;
            rowsByKey.set(key, {
                clientId: project.clientId,
                clientName: client?.name ?? project.client,
                projectId: project.id,
                projectOutcome: project.outcome,
                weekStart,
                minutes: nextMinutes,
                expectedIncome: expectedIncomeFor(project, nextMinutes),
            });
        }

        const rows = Array.from(rowsByKey.values())
            .sort((a, b) => b.weekStart.localeCompare(a.weekStart) || a.projectOutcome.localeCompare(b.projectOutcome));
        return {
            fromDate: query.filters.fromDate,
            toDate: query.filters.toDate,
            totalMinutes: rows.reduce((sum, row) => sum + row.minutes, 0),
            incomeTotals: incomeTotalsFor(rows),
            rows,
        };
    }
}

function expectedIncomeFor(project: Project, minutes: number): ProjectExpectedIncome | null {
    if (!project.hourlyRate) return null;
    const hourlyRate = Number(project.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) return null;
    return {
        amount: formatMoneyAmount((minutes / 60) * hourlyRate),
        currency: project.rateCurrency,
    };
}

function incomeTotalsFor(rows: ProjectHoursReportRow[]): ProjectExpectedIncome[] {
    const totals = new Map<ProjectRateCurrency, number>();
    for (const row of rows) {
        if (!row.expectedIncome) continue;
        totals.set(
            row.expectedIncome.currency,
            (totals.get(row.expectedIncome.currency) ?? 0) + Number(row.expectedIncome.amount),
        );
    }
    return Array.from(totals.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([currency, amount]) => ({ currency, amount: formatMoneyAmount(amount) }));
}

function formatMoneyAmount(amount: number): string {
    return amount.toFixed(2);
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
