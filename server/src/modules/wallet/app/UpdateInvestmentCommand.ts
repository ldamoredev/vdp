import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { AccountRepository } from '../domain/AccountRepository';
import { Investment, UpdateInvestmentData } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';
import { UpdateInvestment } from '../services/UpdateInvestment';

export class UpdateInvestmentCommand extends Command<Investment | null> {
    constructor(
        readonly investmentId: string,
        readonly input: UpdateInvestmentData,
    ) {
        super();
    }
}

export class UpdateInvestmentCommandHandler implements RequestHandler<UpdateInvestmentCommand, Investment | null> {
    constructor(
        private readonly investments: InvestmentRepository,
        private readonly accounts: AccountRepository,
    ) {}

    async handle(command: UpdateInvestmentCommand, identity: Identity): Promise<Investment | null> {
        const { userId } = requireUserIdentity(identity);
        return new UpdateInvestment(this.investments, this.accounts)
            .execute(userId, command.investmentId, command.input);
    }
}
