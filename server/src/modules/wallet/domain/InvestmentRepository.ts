import { CreateInvestmentData, Investment, UpdateInvestmentData } from './Investment';

export abstract class InvestmentRepository {
    abstract findAll(): Promise<Investment[]>;
    abstract findById(id: string): Promise<Investment | null>;
    abstract create(data: CreateInvestmentData): Promise<Investment>;
    abstract update(id: string, data: UpdateInvestmentData): Promise<Investment | null>;
}
