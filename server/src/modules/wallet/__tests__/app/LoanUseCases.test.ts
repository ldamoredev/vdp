import { describe, expect, it } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { CreateLoanCommand, CreateLoanCommandHandler } from '../../app/CreateLoanCommand';
import { ForgiveLoanCommand, ForgiveLoanCommandHandler } from '../../app/ForgiveLoanCommand';
import { GetLoanQuery, GetLoanQueryHandler } from '../../app/GetLoanQuery';
import { ListLoansQuery, ListLoansQueryHandler } from '../../app/ListLoansQuery';
import { MarkLoanRepaidCommand, MarkLoanRepaidCommandHandler } from '../../app/MarkLoanRepaidCommand';
import { RegisterLoanPaymentCommand, RegisterLoanPaymentCommandHandler } from '../../app/RegisterLoanPaymentCommand';
import type { CreateLoanData } from '../../domain/Loan';
import { FakeLoanRepository } from '../fakes/FakeLoanRepository';

const identity = new UserIdentity('user-1', 'test@example.com', 'Test', ['user']);
const otherIdentity = new UserIdentity('user-2', 'other@example.com', 'Other', ['user']);

const loanInput: CreateLoanData = {
    direction: 'lent',
    counterparty: 'Marco',
    principal: '1000.00',
    currency: 'USD',
    date: '2026-06-01',
    dueDate: null,
    note: null,
};

function setup() {
    const loans = new FakeLoanRepository();
    return {
        loans,
        create: new CreateLoanCommandHandler(loans),
        list: new ListLoansQueryHandler(loans),
        get: new GetLoanQueryHandler(loans),
        pay: new RegisterLoanPaymentCommandHandler(loans),
        repay: new MarkLoanRepaidCommandHandler(loans),
        forgive: new ForgiveLoanCommandHandler(loans),
    };
}

describe('Loan use cases', () => {
    it('creates and lists a loan for its owner', async () => {
        const { create, list } = setup();

        const created = await create.handle(new CreateLoanCommand(loanInput), identity);
        const loans = await list.handle(new ListLoansQuery(), identity);

        expect(created.status).toBe('open');
        expect(loans).toHaveLength(1);
        expect(loans[0].outstanding()).toBe('1000.00');
    });

    it('registers a payment and reduces the outstanding balance', async () => {
        const { create, pay } = setup();
        const created = await create.handle(new CreateLoanCommand(loanInput), identity);

        const updated = await pay.handle(
            new RegisterLoanPaymentCommand(created.id, { amount: '400.00', date: '2026-06-10' }),
            identity,
        );

        expect(updated!.outstanding()).toBe('600.00');
        expect(updated!.payments).toHaveLength(1);
    });

    it('returns null when paying a loan that does not exist', async () => {
        const { pay } = setup();

        const result = await pay.handle(
            new RegisterLoanPaymentCommand('missing', { amount: '10.00', date: '2026-06-10' }),
            identity,
        );

        expect(result).toBeNull();
    });

    it('maps an invalid transition to a 422 domain error', async () => {
        const { create, repay, pay } = setup();
        const created = await create.handle(new CreateLoanCommand(loanInput), identity);
        await repay.handle(new MarkLoanRepaidCommand(created.id), identity);

        await expect(
            pay.handle(new RegisterLoanPaymentCommand(created.id, { amount: '10.00', date: '2026-06-10' }), identity),
        ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('forgives an open loan and zeroes its outstanding', async () => {
        const { create, forgive } = setup();
        const created = await create.handle(new CreateLoanCommand(loanInput), identity);

        const forgiven = await forgive.handle(new ForgiveLoanCommand(created.id), identity);

        expect(forgiven!.status).toBe('forgiven');
        expect(forgiven!.outstanding()).toBe('0.00');
    });

    it('does not expose or mutate another user loan', async () => {
        const { create, list, get, pay } = setup();
        const created = await create.handle(new CreateLoanCommand(loanInput), identity);

        expect(await list.handle(new ListLoansQuery(), otherIdentity)).toHaveLength(0);
        expect(await get.handle(new GetLoanQuery(created.id), otherIdentity)).toBeNull();
        expect(
            await pay.handle(
                new RegisterLoanPaymentCommand(created.id, { amount: '10.00', date: '2026-06-10' }),
                otherIdentity,
            ),
        ).toBeNull();
    });
});
