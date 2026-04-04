import { randomUUID } from 'crypto';
import { CreateInvestmentData, Investment, UpdateInvestmentData } from '../../domain/Investment';
import { InvestmentRepository } from '../../domain/InvestmentRepository';

export class FakeInvestmentRepository extends InvestmentRepository {
    private store = new Map<string, Investment>();

    seed(investments: Investment[]): void {
        for (const investment of investments) {
            this.store.set(investment.id, investment);
        }
    }

    async findAll(_userId: string): Promise<Investment[]> {
        return Array.from(this.store.values());
    }

    async findById(_userId: string, id: string): Promise<Investment | null> {
        return this.store.get(id) ?? null;
    }

    async create(_userId: string, data: CreateInvestmentData): Promise<Investment> {
        const now = new Date();
        const investment: Investment = {
            id: randomUUID(),
            name: data.name,
            type: data.type,
            accountId: data.accountId ?? null,
            currency: data.currency,
            investedAmount: data.investedAmount,
            currentValue: data.currentValue,
            startDate: data.startDate,
            endDate: data.endDate ?? null,
            rate: data.rate ?? null,
            notes: data.notes ?? null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };
        this.store.set(investment.id, investment);
        return investment;
    }

    async update(_userId: string, id: string, data: UpdateInvestmentData): Promise<Investment | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        const updated: Investment = {
            ...existing,
            ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
            updatedAt: new Date(),
        };
        this.store.set(id, updated);
        return updated;
    }
}
