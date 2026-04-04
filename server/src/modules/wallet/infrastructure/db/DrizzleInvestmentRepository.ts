import { Database } from '../../../common/base/db/Database';
import { and, eq } from 'drizzle-orm';
import { investments } from '../../schema';
import { CreateInvestmentData, Investment, UpdateInvestmentData } from '../../domain/Investment';
import { InvestmentRepository } from '../../domain/InvestmentRepository';

export class DrizzleInvestmentRepository extends InvestmentRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async findAll(userId: string): Promise<Investment[]> {
        return this.db.query
            .select()
            .from(investments)
            .where(eq(investments.ownerUserId, userId));
    }

    async findById(userId: string, id: string): Promise<Investment | null> {
        const [row] = await this.db.query
            .select()
            .from(investments)
            .where(and(eq(investments.id, id), eq(investments.ownerUserId, userId)));
        return row ?? null;
    }

    async create(userId: string, data: CreateInvestmentData): Promise<Investment> {
        const [row] = await this.db.query
            .insert(investments)
            .values({
                ownerUserId: userId,
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

    async update(userId: string, id: string, data: UpdateInvestmentData): Promise<Investment | null> {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        for (const field of DrizzleInvestmentRepository.UPDATABLE_FIELDS) {
            if (data[field] !== undefined) updateData[field] = data[field];
        }

        const [updated] = await this.db.query
            .update(investments)
            .set(updateData)
            .where(and(eq(investments.id, id), eq(investments.ownerUserId, userId)))
            .returning();

        return updated ?? null;
    }
}
