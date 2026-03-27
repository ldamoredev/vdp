import { Database } from '../../../common/base/db/Database';
import { eq } from 'drizzle-orm';
import { investments } from '../../schema';
import { CreateInvestmentData, Investment, UpdateInvestmentData } from '../../domain/Investment';
import { InvestmentRepository } from '../../domain/InvestmentRepository';

export class DrizzleInvestmentRepository extends InvestmentRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async findAll(): Promise<Investment[]> {
        return this.db.query.select().from(investments);
    }

    async findById(id: string): Promise<Investment | null> {
        const [row] = await this.db.query.select().from(investments).where(eq(investments.id, id));
        return row ?? null;
    }

    async create(data: CreateInvestmentData): Promise<Investment> {
        const [row] = await this.db.query
            .insert(investments)
            .values({
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
            })
            .returning();

        return row;
    }

    private static readonly UPDATABLE_FIELDS = [
        'name',
        'type',
        'accountId',
        'currency',
        'investedAmount',
        'currentValue',
        'startDate',
        'endDate',
        'rate',
        'notes',
    ] as const;

    async update(id: string, data: UpdateInvestmentData): Promise<Investment | null> {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        for (const field of DrizzleInvestmentRepository.UPDATABLE_FIELDS) {
            if (data[field] !== undefined) updateData[field] = data[field];
        }

        const [updated] = await this.db.query
            .update(investments)
            .set(updateData)
            .where(eq(investments.id, id))
            .returning();

        return updated ?? null;
    }
}
