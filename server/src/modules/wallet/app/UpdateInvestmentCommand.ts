import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { AccountRepository } from '../domain/AccountRepository';
import { Investment, UpdateInvestmentData } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';

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
        const existing = await this.investments.findById(userId, command.investmentId);
        if (!existing) return null;

        if (command.input.accountId) {
            const account = await this.accounts.findById(userId, command.input.accountId);
            if (!account) {
                throw new NotFoundHttpError('Account not found');
            }
        }

        return this.investments.update(userId, command.investmentId, command.input);
    }
}
