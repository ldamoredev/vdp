import { Investment, UpdateInvestmentData } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';

export class UpdateInvestment {
    constructor(private readonly investments: InvestmentRepository) {}

    async execute(id: string, data: UpdateInvestmentData): Promise<Investment | null> {
        return this.investments.update(id, data);
    }
}
