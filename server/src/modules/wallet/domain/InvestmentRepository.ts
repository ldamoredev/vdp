import { CreateInvestmentData, Investment, UpdateInvestmentData } from './Investment';

export abstract class InvestmentRepository {
    abstract findAll(userId: string): Promise<Investment[]>;
    abstract findById(userId: string, id: string): Promise<Investment | null>;
    abstract create(userId: string, data: CreateInvestmentData): Promise<Investment>;
    abstract update(userId: string, id: string, data: UpdateInvestmentData): Promise<Investment | null>;
}
