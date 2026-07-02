import { describe, expect, it } from 'vitest';

import { Loan, type CreateLoanData } from '../../domain/Loan';

function newLoan(overrides: Partial<CreateLoanData> = {}): Loan {
    return Loan.create({
        direction: 'lent',
        counterparty: 'Marco',
        principal: '1000.00',
        currency: 'USD',
        date: '2026-06-01',
        dueDate: null,
        note: null,
        ...overrides,
    });
}

describe('Loan', () => {
    it('creates an open loan with no payments and full outstanding', () => {
        const loan = newLoan();

        expect(loan.id).toBeTruthy();
        expect(loan.status).toBe('open');
        expect(loan.payments).toHaveLength(0);
        expect(loan.outstanding()).toBe('1000.00');
        expect(loan.isOpen()).toBe(true);
    });

    it('reduces outstanding by a partial payment and stays open', () => {
        const loan = newLoan();

        loan.registerPayment({ amount: '400.00', date: '2026-06-10', note: 'primer pago' });

        expect(loan.payments).toHaveLength(1);
        expect(loan.outstanding()).toBe('600.00');
        expect(loan.status).toBe('open');
    });

    it('auto-transitions to repaid once payments cover the principal', () => {
        const loan = newLoan();

        loan.registerPayment({ amount: '600.00', date: '2026-06-10' });
        loan.registerPayment({ amount: '400.00', date: '2026-06-20' });

        expect(loan.outstanding()).toBe('0.00');
        expect(loan.status).toBe('repaid');
        expect(loan.isOpen()).toBe(false);
    });

    it('rejects a non-positive payment amount', () => {
        const loan = newLoan();

        expect(() => loan.registerPayment({ amount: '0', date: '2026-06-10' })).toThrow(/positive/i);
        expect(() => loan.registerPayment({ amount: '-50', date: '2026-06-10' })).toThrow(/positive/i);
    });

    it('rejects a payment on a loan that is not open', () => {
        const loan = newLoan();
        loan.markRepaid();

        expect(() => loan.registerPayment({ amount: '100.00', date: '2026-06-10' })).toThrow(/not open/i);
    });

    it('marks an open loan as repaid manually', () => {
        const loan = newLoan();

        loan.markRepaid();

        expect(loan.status).toBe('repaid');
    });

    it('forgives an open loan and zeroes its outstanding', () => {
        const loan = newLoan();
        loan.registerPayment({ amount: '200.00', date: '2026-06-10' });

        loan.forgive();

        expect(loan.status).toBe('forgiven');
        expect(loan.outstanding()).toBe('0.00');
    });

    it('does not allow forgiving an already repaid loan', () => {
        const loan = newLoan();
        loan.markRepaid();

        expect(() => loan.forgive()).toThrow();
    });

    it('round-trips through a snapshot including payments', () => {
        const loan = newLoan({ direction: 'borrowed', dueDate: '2026-12-31', note: 'prestamo de Ana' });
        loan.registerPayment({ amount: '250.00', date: '2026-06-15', note: 'cuota' });

        const restored = Loan.fromSnapshot(loan.toSnapshot());

        expect(restored.toSnapshot()).toEqual(loan.toSnapshot());
        expect(restored.direction).toBe('borrowed');
        expect(restored.outstanding()).toBe('750.00');
        expect(restored.payments).toHaveLength(1);
    });

    it('rejects unknown direction, currency, and status from persistence', () => {
        const base = loanSnapshotBase();

        expect(() => Loan.fromSnapshot({ ...base, direction: 'gifted' })).toThrow(/direction/i);
        expect(() => Loan.fromSnapshot({ ...base, currency: 'EUR' })).toThrow(/currency/i);
        expect(() => Loan.fromSnapshot({ ...base, status: 'settled' })).toThrow(/status/i);
    });
});

function loanSnapshotBase() {
    return {
        id: 'loan-1',
        direction: 'lent',
        counterparty: 'Marco',
        principal: '1000.00',
        currency: 'USD',
        date: '2026-06-01',
        dueDate: null,
        note: null,
        status: 'open',
        payments: [],
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    };
}
