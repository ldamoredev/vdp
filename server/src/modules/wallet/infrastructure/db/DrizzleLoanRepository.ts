import { and, asc, eq } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { CreateLoanData, Loan, LoanPayment } from '../../domain/Loan';
import { LoanRepository } from '../../domain/LoanRepository';
import { loanPayments, loans } from './schema';

type LoanRow = typeof loans.$inferSelect;
type PaymentRow = typeof loanPayments.$inferSelect;

export class DrizzleLoanRepository extends LoanRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createLoan(userId: string, data: CreateLoanData): Promise<Loan> {
        const loan = Loan.create(data);
        const snapshot = loan.toSnapshot();
        await this.db.query.insert(loans).values({
            id: snapshot.id,
            ownerUserId: userId,
            direction: snapshot.direction,
            counterparty: snapshot.counterparty,
            principal: snapshot.principal,
            currency: snapshot.currency,
            date: snapshot.date,
            dueDate: snapshot.dueDate,
            note: snapshot.note,
            status: snapshot.status,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
        });
        return loan;
    }

    async listLoans(userId: string): Promise<Loan[]> {
        const loanRows = await this.db.query
            .select()
            .from(loans)
            .where(eq(loans.ownerUserId, userId));
        if (loanRows.length === 0) return [];

        const paymentRows = await this.db.query
            .select()
            .from(loanPayments)
            .where(eq(loanPayments.ownerUserId, userId))
            .orderBy(asc(loanPayments.date), asc(loanPayments.createdAt));

        const paymentsByLoan = new Map<string, LoanPayment[]>();
        for (const row of paymentRows) {
            const list = paymentsByLoan.get(row.loanId) ?? [];
            list.push(toPayment(row));
            paymentsByLoan.set(row.loanId, list);
        }

        return loanRows.map((row) => Loan.fromSnapshot(toSnapshot(row, paymentsByLoan.get(row.id) ?? [])));
    }

    async getLoan(userId: string, id: string): Promise<Loan | null> {
        const [row] = await this.db.query
            .select()
            .from(loans)
            .where(and(eq(loans.id, id), eq(loans.ownerUserId, userId)));
        if (!row) return null;

        const paymentRows = await this.db.query
            .select()
            .from(loanPayments)
            .where(and(eq(loanPayments.loanId, id), eq(loanPayments.ownerUserId, userId)))
            .orderBy(asc(loanPayments.date), asc(loanPayments.createdAt));

        return Loan.fromSnapshot(toSnapshot(row, paymentRows.map(toPayment)));
    }

    async save(userId: string, loan: Loan): Promise<Loan> {
        const snapshot = loan.toSnapshot();

        await this.db.query
            .update(loans)
            .set({
                status: snapshot.status,
                dueDate: snapshot.dueDate,
                note: snapshot.note,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(loans.id, snapshot.id), eq(loans.ownerUserId, userId)));

        // Payments are append-only; insert any not yet persisted, skip the rest.
        if (snapshot.payments.length > 0) {
            await this.db.query
                .insert(loanPayments)
                .values(
                    snapshot.payments.map((payment) => ({
                        id: payment.id,
                        ownerUserId: userId,
                        loanId: snapshot.id,
                        amount: payment.amount,
                        date: payment.date,
                        note: payment.note,
                        createdAt: payment.createdAt,
                    })),
                )
                .onConflictDoNothing();
        }

        return loan;
    }
}

function toPayment(row: PaymentRow): LoanPayment {
    return {
        id: row.id,
        amount: row.amount,
        date: row.date,
        note: row.note,
        createdAt: row.createdAt,
    };
}

function toSnapshot(row: LoanRow, payments: LoanPayment[]): Parameters<typeof Loan.fromSnapshot>[0] {
    return {
        id: row.id,
        direction: row.direction,
        counterparty: row.counterparty,
        principal: row.principal,
        currency: row.currency,
        date: row.date,
        dueDate: row.dueDate,
        note: row.note,
        status: row.status,
        payments,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
