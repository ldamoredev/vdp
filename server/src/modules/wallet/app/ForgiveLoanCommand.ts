import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainHttpError } from '../../common/http/errors';
import { Loan } from '../domain/Loan';
import { LoanRepository } from '../domain/LoanRepository';

export class ForgiveLoanCommand extends Command<Loan | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class ForgiveLoanCommandHandler implements RequestHandler<ForgiveLoanCommand, Loan | null> {
    constructor(private readonly loans: LoanRepository) {}

    async handle(command: ForgiveLoanCommand, identity: Identity): Promise<Loan | null> {
        const { userId } = requireUserIdentity(identity);
        const loan = await this.loans.getLoan(userId, command.id);
        if (!loan) return null;
        try {
            loan.forgive();
        } catch (err) {
            throw new DomainHttpError(err instanceof Error ? err.message : 'Cannot forgive loan');
        }
        return this.loans.save(userId, loan);
    }
}
