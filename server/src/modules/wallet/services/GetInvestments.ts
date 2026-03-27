import { Investment } from '../domain/Investment';
import { InvestmentRepository } from '../domain/InvestmentRepository';

export class GetInvestments {
    constructor(private readonly investments: InvestmentRepository) {}

    async execute(): Promise<Investment[]> {
        return this.investments.findAll();
    }
}
