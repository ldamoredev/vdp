import { CreateInvestmentData, Investment } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';
import { AccountRepository } from '../domain/AccountRepository';
import { NotFoundHttpError } from '../../common/http/errors';

export class CreateInvestment {
    constructor(
        private readonly investments: InvestmentRepository,
        private readonly accounts: AccountRepository,
    ) {}

    async execute(userId: string, data: CreateInvestmentData): Promise<Investment> {
        if (data.accountId) {
            const account = await this.accounts.findById(userId, data.accountId);
            if (!account) {
                throw new NotFoundHttpError('Account not found');
            }
        }

        return this.investments.create(userId, data);
    }
}
