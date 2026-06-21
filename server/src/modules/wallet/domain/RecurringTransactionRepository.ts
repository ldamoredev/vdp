import { RecurringTransaction, RecurringType } from './RecurringTransaction';

export type CreateRecurringTransactionData = {
    readonly accountId: string;
    readonly categoryId?: string | null;
    readonly type: RecurringType;
    readonly amount: string;
    readonly currency: string;
    readonly description?: string | null;
    readonly dayOfMonth: number;
    readonly startDate: string;
    readonly endDate?: string | null;
};

export abstract class RecurringTransactionRepository {
    abstract list(userId: string): Promise<RecurringTransaction[]>;
    abstract findById(userId: string, id: string): Promise<RecurringTransaction | null>;
    abstract create(userId: string, data: CreateRecurringTransactionData): Promise<RecurringTransaction>;
    /**
     * Atomically advances `lastRunDate` to `date` only if the stored value is
     * still earlier (or null), returning whether this caller won. This is the
     * concurrency guard for materialization: each occurrence is claimed by
     * exactly one of any racing runs, so the transaction is never duplicated.
     */
    abstract advanceLastRunIfBefore(userId: string, id: string, date: string): Promise<boolean>;
    abstract delete(userId: string, id: string): Promise<RecurringTransaction | null>;
}
