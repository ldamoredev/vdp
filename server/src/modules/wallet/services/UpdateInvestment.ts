import { Investment, UpdateInvestmentData } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';
import { AccountRepository } from '../domain/AccountRepository';
import { NotFoundHttpError } from '../../common/http/errors';

export class UpdateInvestment {
    constructor(
        private readonly investments: InvestmentRepository,
        private readonly accounts: AccountRepository,
    ) {}

    async execute(userId: string, id: string, data: UpdateInvestmentData): Promise<Investment | null> {
        const existing = await this.investments.findById(userId, id);
        if (!existing) return null;

        if (data.accountId) {
            const account = await this.accounts.findById(userId, data.accountId);
            if (!account) {
                throw new NotFoundHttpError('Account not found');
            }
        }

        return this.investments.update(userId, id, data);
    }
}
