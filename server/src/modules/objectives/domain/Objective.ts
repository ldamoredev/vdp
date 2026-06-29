export type ObjectiveMetricSource =
    | 'manual'
    | 'projects_hours'
    | 'tasks_completed'
    | 'wallet_savings'
    | 'health_habit_completions';
export type ObjectiveStatus = 'active' | 'archived' | 'achieved';
export type ObjectiveCurrency = 'ARS' | 'USD';

const CURRENCY_SCOPED_SOURCES: readonly ObjectiveMetricSource[] = ['wallet_savings'];
const TARGETED_SOURCES: readonly ObjectiveMetricSource[] = ['health_habit_completions'];

type ObjectiveSnapshotLike = Omit<ObjectiveSnapshot, 'metricSource' | 'status' | 'currency' | 'metricTargetId'> & {
    metricSource: string;
    status: string;
    currency?: string | null;
    metricTargetId?: string | null;
};

export class Objective {
    private constructor(
        public readonly id: string,
        public readonly ownerUserId: string,
        public title: string,
        public periodStart: string,
        public periodEnd: string,
        public metricSource: ObjectiveMetricSource,
        public metricTargetId: string | null,
        public target: number,
        public unit: string,
        public manualValue: number | null,
        public currency: ObjectiveCurrency | null,
        public status: ObjectiveStatus,
        public archivedAt: Date | null,
        public achievedAt: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    update(data: ObjectiveUpdate): void {
        const nextPeriodStart = data.periodStart ?? this.periodStart;
        const nextPeriodEnd = data.periodEnd ?? this.periodEnd;
        Objective.assertValidPeriod(nextPeriodStart, nextPeriodEnd);

        if (data.title !== undefined) this.title = data.title;
        if (data.periodStart !== undefined) this.periodStart = data.periodStart;
        if (data.periodEnd !== undefined) this.periodEnd = data.periodEnd;
        const previousMetricSource = this.metricSource;
        if (data.metricSource !== undefined) this.metricSource = data.metricSource;
        if (data.target !== undefined) this.target = Objective.assertPositiveTarget(data.target);
        if (data.unit !== undefined) this.unit = Objective.assertNonEmptyUnit(data.unit);
        if (data.manualValue !== undefined) this.manualValue = data.manualValue;
        if (this.metricSource !== 'manual') this.manualValue = null;
        const nextCurrency = data.currency !== undefined ? data.currency : this.currency;
        this.currency = Objective.resolveCurrency(this.metricSource, nextCurrency);
        const nextMetricTargetId = data.metricTargetId !== undefined
            ? data.metricTargetId
            : previousMetricSource === this.metricSource ? this.metricTargetId : null;
        this.metricTargetId = Objective.resolveMetricTargetId(this.metricSource, nextMetricTargetId);
        this.updatedAt = new Date();
    }

    markAchieved(): void {
        if (this.status !== 'active') return;
        this.status = 'achieved';
        this.achievedAt = new Date();
        this.updatedAt = new Date();
    }

    archive(): void {
        if (this.status === 'archived') return;
        this.status = 'archived';
        this.archivedAt = new Date();
        this.updatedAt = new Date();
    }

    isActive(): boolean {
        return this.status === 'active';
    }

    toSnapshot(): ObjectiveSnapshot {
        return {
            id: this.id,
            ownerUserId: this.ownerUserId,
            title: this.title,
            periodStart: this.periodStart,
            periodEnd: this.periodEnd,
            metricSource: this.metricSource,
            metricTargetId: this.metricTargetId,
            target: this.target,
            unit: this.unit,
            manualValue: this.manualValue,
            currency: this.currency,
            status: this.status,
            archivedAt: this.archivedAt,
            achievedAt: this.achievedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static fromSnapshot(s: ObjectiveSnapshotLike): Objective {
        Objective.assertValidPeriod(s.periodStart, s.periodEnd);
        const metricSource = Objective.parseMetricSource(s.metricSource);
        return new Objective(
            s.id,
            s.ownerUserId,
            s.title,
            s.periodStart,
            s.periodEnd,
            metricSource,
            Objective.resolveMetricTargetId(metricSource, s.metricTargetId ?? null),
            Objective.assertPositiveTarget(s.target),
            Objective.assertNonEmptyUnit(s.unit),
            metricSource === 'manual' ? s.manualValue : null,
            Objective.resolveCurrency(metricSource, s.currency ?? null),
            Objective.parseStatus(s.status),
            s.archivedAt,
            s.achievedAt,
            s.createdAt,
            s.updatedAt,
        );
    }

    private static assertValidPeriod(start: string, end: string): void {
        if (end < start) {
            throw new Error('Objective period end must be on or after period start');
        }
    }

    private static assertPositiveTarget(target: number): number {
        if (!Number.isFinite(target) || target <= 0) {
            throw new Error('Objective target must be positive');
        }
        return target;
    }

    private static assertNonEmptyUnit(unit: string): string {
        const normalized = unit.trim();
        if (!normalized) throw new Error('Objective unit is required');
        return normalized;
    }

    private static parseMetricSource(metricSource: string): ObjectiveMetricSource {
        switch (metricSource) {
            case 'manual':
            case 'projects_hours':
            case 'tasks_completed':
            case 'wallet_savings':
            case 'health_habit_completions':
                return metricSource;
            default:
                throw new Error(`Invalid objective metric source: ${metricSource}`);
        }
    }

    private static resolveCurrency(
        source: ObjectiveMetricSource,
        currency: string | null,
    ): ObjectiveCurrency | null {
        if (!CURRENCY_SCOPED_SOURCES.includes(source)) return null;
        if (currency === null) {
            throw new Error('Objective currency is required for this metric source');
        }
        return Objective.parseCurrency(currency);
    }

    private static parseCurrency(currency: string): ObjectiveCurrency {
        switch (currency) {
            case 'ARS':
            case 'USD':
                return currency;
            default:
                throw new Error(`Invalid objective currency: ${currency}`);
        }
    }

    private static resolveMetricTargetId(
        source: ObjectiveMetricSource,
        metricTargetId: string | null,
    ): string | null {
        if (!TARGETED_SOURCES.includes(source)) return null;
        const normalized = metricTargetId?.trim();
        if (!normalized) {
            throw new Error('Objective metric target is required for this metric source');
        }
        return normalized;
    }

    private static parseStatus(status: string): ObjectiveStatus {
        switch (status) {
            case 'active':
            case 'archived':
            case 'achieved':
                return status;
            default:
                throw new Error(`Invalid objective status: ${status}`);
        }
    }
}

export type ObjectiveUpdate = {
    title?: string;
    periodStart?: string;
    periodEnd?: string;
    metricSource?: ObjectiveMetricSource;
    metricTargetId?: string | null;
    target?: number;
    unit?: string;
    manualValue?: number | null;
    currency?: ObjectiveCurrency | null;
};

export type ObjectiveSnapshot = {
    id: string;
    ownerUserId: string;
    title: string;
    periodStart: string;
    periodEnd: string;
    metricSource: ObjectiveMetricSource;
    metricTargetId: string | null;
    target: number;
    unit: string;
    manualValue: number | null;
    currency: ObjectiveCurrency | null;
    status: ObjectiveStatus;
    archivedAt: Date | null;
    achievedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};
