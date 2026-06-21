import { parseLocalDateISO } from '../../common/base/time/dates';

export type RecurringType = 'expense' | 'income';

/**
 * A user-defined rule that materializes real transactions on a monthly cadence
 * (rent, subscriptions, utilities) so stats and spike detection stop operating
 * on incomplete data. Materialization is lazy (on wallet load, no scheduler):
 * `dueOccurrences` is the pure heart of it — which dates still need a
 * transaction created.
 */
export class RecurringTransaction {
    constructor(
        public id: string,
        public accountId: string,
        public categoryId: string | null,
        public type: RecurringType,
        public amount: string,
        public currency: string,
        public description: string | null,
        public dayOfMonth: number,
        public startDate: string,
        public endDate: string | null,
        public lastRunDate: string | null,
        public active: boolean,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}

    /**
     * Occurrence dates (YYYY-MM-DD) that still need a transaction: on
     * `dayOfMonth` (clamped to the month's length) of each month, on/after the
     * start date, strictly after the last run, up to `today` and the end date.
     */
    dueOccurrences(today: string): string[] {
        const start = this.startDate;
        const end = this.endDate;
        const after = this.lastRunDate;
        const anchor = parseLocalDateISO(after ?? start);

        const result: string[] = [];
        let year = anchor.getFullYear();
        let month = anchor.getMonth(); // 0-based

        for (;;) {
            const occ = this.occurrenceInMonth(year, month);
            if (occ > today) break;
            if (occ >= start && (!end || occ <= end) && (!after || occ > after)) {
                result.push(occ);
            }
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
        }
        return result;
    }

    private occurrenceInMonth(year: number, monthIndex0: number): string {
        const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
        const day = Math.min(this.dayOfMonth, daysInMonth);
        return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    toSnapshot(): RecurringTransactionSnapshot {
        return {
            id: this.id,
            accountId: this.accountId,
            categoryId: this.categoryId,
            type: this.type,
            amount: this.amount,
            currency: this.currency,
            description: this.description,
            dayOfMonth: this.dayOfMonth,
            startDate: this.startDate,
            endDate: this.endDate,
            lastRunDate: this.lastRunDate,
            active: this.active,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    static fromSnapshot(s: RecurringTransactionSnapshot): RecurringTransaction {
        return new RecurringTransaction(
            s.id,
            s.accountId,
            s.categoryId,
            s.type,
            s.amount,
            s.currency,
            s.description,
            s.dayOfMonth,
            s.startDate,
            s.endDate,
            s.lastRunDate,
            s.active,
            s.createdAt,
            s.updatedAt,
        );
    }
}

export type RecurringTransactionSnapshot = {
    id: string;
    accountId: string;
    categoryId: string | null;
    type: RecurringType;
    amount: string;
    currency: string;
    description: string | null;
    dayOfMonth: number;
    startDate: string;
    endDate: string | null;
    lastRunDate: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
};
