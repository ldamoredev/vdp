import { Account, CreateAccountData, UpdateAccountData } from '../../domain/Account';
import { AccountRepository } from '../../domain/AccountRepository';
import { Database } from '../../../common/base/db/Database';
import { accounts } from '../../schema';
import { eq } from 'drizzle-orm';

export class DrizzleAccountRepository extends AccountRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async findAll(): Promise<Account[]> {
        return this.db.query.select().from(accounts);
    }

    async findById(id: string): Promise<Account | null> {
        const [row] = await this.db.query.select().from(accounts).where(eq(accounts.id, id));
        return row ?? null;
    }

    async create(data: CreateAccountData): Promise<Account> {
        const [row] = await this.db.query
            .insert(accounts)
            .values({
                name: data.name,
                currency: data.currency,
                type: data.type,
                initialBalance: data.initialBalance ?? '0',
            })
            .returning();

        return row;
    }

    private static readonly UPDATABLE_FIELDS = ['name', 'currency', 'type', 'initialBalance'] as const;

    async update(id: string, data: UpdateAccountData): Promise<Account | null> {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        for (const field of DrizzleAccountRepository.UPDATABLE_FIELDS) {
            if (data[field] !== undefined) updateData[field] = data[field];
        }

        const [updated] = await this.db.query
            .update(accounts)
            .set(updateData)
            .where(eq(accounts.id, id))
            .returning();

        return updated ?? null;
    }

    async delete(id: string): Promise<Account | null> {
        const [deleted] = await this.db.query
            .delete(accounts)
            .where(eq(accounts.id, id))
            .returning();

        return deleted ?? null;
    }
}
