import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { AccountRepository } from '../domain/AccountRepository';
import { CreateInvestmentData, Investment } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';

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
        if (command.input.accountId) {
            const account = await this.accounts.findById(userId, command.input.accountId);
            if (!account) {
                throw new NotFoundHttpError('Account not found');
            }
        }

        return this.investments.create(userId, command.input);
    }
}
