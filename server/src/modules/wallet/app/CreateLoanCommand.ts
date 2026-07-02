import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { CreateLoanData, Loan } from '../domain/Loan';
import { LoanRepository } from '../domain/LoanRepository';

export class CreateLoanCommand extends Command<Loan> {
    constructor(readonly input: CreateLoanData) {
        super();
    }
}

export class CreateLoanCommandHandler implements RequestHandler<CreateLoanCommand, Loan> {
    constructor(private readonly loans: LoanRepository) {}

    async handle(command: CreateLoanCommand, identity: Identity): Promise<Loan> {
        const { userId } = requireUserIdentity(identity);
        return this.loans.createLoan(userId, command.input);
    }
}
