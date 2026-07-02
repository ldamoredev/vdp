import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { DomainHttpError } from '../../common/http/errors';
import { Loan, RegisterPaymentData } from '../domain/Loan';
import { LoanRepository } from '../domain/LoanRepository';

export class RegisterLoanPaymentCommand extends Command<Loan | null> {
    constructor(
        readonly loanId: string,
        readonly input: RegisterPaymentData,
    ) {
        super();
    }
}

export class RegisterLoanPaymentCommandHandler implements RequestHandler<RegisterLoanPaymentCommand, Loan | null> {
    constructor(private readonly loans: LoanRepository) {}

    async handle(command: RegisterLoanPaymentCommand, identity: Identity): Promise<Loan | null> {
        const { userId } = requireUserIdentity(identity);
        const loan = await this.loans.getLoan(userId, command.loanId);
        if (!loan) return null;
        try {
            loan.registerPayment(command.input);
        } catch (err) {
            throw new DomainHttpError(err instanceof Error ? err.message : 'Cannot register payment');
        }
        return this.loans.save(userId, loan);
    }
}
