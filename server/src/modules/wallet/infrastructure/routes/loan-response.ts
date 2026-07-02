import type { Loan as LoanResponse } from '@vdp/shared';

import { Loan } from '../../domain/Loan';

/**
 * Maps a Loan entity to its HTTP wire shape: ISO date strings plus the
 * server-computed `outstanding`/`paidTotal` (per-currency; never cross-currency).
 */
export function toLoanResponse(loan: Loan): LoanResponse {
    const snapshot = loan.toSnapshot();
    return {
        id: snapshot.id,
        direction: snapshot.direction,
        counterparty: snapshot.counterparty,
        principal: snapshot.principal,
        currency: snapshot.currency,
        date: snapshot.date,
        dueDate: snapshot.dueDate,
        note: snapshot.note,
        status: snapshot.status,
        payments: snapshot.payments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            date: payment.date,
            note: payment.note,
            createdAt: payment.createdAt.toISOString(),
        })),
        outstanding: loan.outstanding(),
        paidTotal: loan.paidTotal(),
        createdAt: snapshot.createdAt.toISOString(),
        updatedAt: snapshot.updatedAt.toISOString(),
    };
}
