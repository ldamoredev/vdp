import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainHttpError } from '../../common/http/errors';
import { Loan } from '../domain/Loan';
import { LoanRepository } from '../domain/LoanRepository';

export class MarkLoanRepaidCommand extends Command<Loan | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class MarkLoanRepaidCommandHandler implements RequestHandler<MarkLoanRepaidCommand, Loan | null> {
    constructor(private readonly loans: LoanRepository) {}

    async handle(command: MarkLoanRepaidCommand, identity: Identity): Promise<Loan | null> {
        const { userId } = requireUserIdentity(identity);
        const loan = await this.loans.getLoan(userId, command.id);
        if (!loan) return null;
        try {
            loan.markRepaid();
        } catch (err) {
            throw new DomainHttpError(err instanceof Error ? err.message : 'Cannot mark loan repaid');
        }
        return this.loans.save(userId, loan);
    }
}
