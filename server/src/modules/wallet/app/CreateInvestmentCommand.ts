import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { AccountRepository } from '../domain/AccountRepository';
import { CreateInvestmentData, Investment } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';
import { CreateInvestment } from '../services/CreateInvestment';

export class CreateInvestmentCommand extends Command<Investment> {
    constructor(readonly input: CreateInvestmentData) {
        super();
    }
}

export class CreateInvestmentCommandHandler implements RequestHandler<CreateInvestmentCommand, Investment> {
    constructor(
        private readonly investments: InvestmentRepository,
        private readonly accounts: AccountRepository,
    ) {}

    async handle(command: CreateInvestmentCommand, identity: Identity): Promise<Investment> {
        const { userId } = requireUserIdentity(identity);
        return new CreateInvestment(this.investments, this.accounts).execute(userId, command.input);
    }
}
