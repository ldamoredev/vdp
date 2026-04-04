import { CreateInvestmentData, Investment } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';

export class CreateInvestment {
    constructor(private readonly investments: InvestmentRepository) {}

    async execute(userId: string, data: CreateInvestmentData): Promise<Investment> {
        return this.investments.create(userId, data);
    }
}
