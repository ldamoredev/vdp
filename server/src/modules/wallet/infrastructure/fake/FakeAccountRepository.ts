import { Account, CreateAccountData, UpdateAccountData } from '../../domain/Account';
import { AccountRepository } from '../../domain/AccountRepository';
import { randomUUID } from 'crypto';

export class FakeAccountRepository extends AccountRepository {
    private store = new Map<string, Account>();

    // ─── Test helpers ──────────────────────────────────

    seed(accounts: Account[]): void {
        for (const account of accounts) {
            this.store.set(account.id, account);
        }
    }

    clear(): void {
        this.store.clear();
    }

    get size(): number {
        return this.store.size;
    }

    // ─── CRUD ──────────────────────────────────────────

    async findAll(): Promise<Account[]> {
        return Array.from(this.store.values());
    }

    async findById(id: string): Promise<Account | null> {
        return this.store.get(id) ?? null;
    }

    async create(data: CreateAccountData): Promise<Account> {
        const now = new Date();
        const account: Account = {
            id: randomUUID(),
            name: data.name,
            currency: data.currency,
            type: data.type,
            initialBalance: data.initialBalance ?? '0',
            isActive: true,
            createdAt: now,
            updatedAt: now,
        };
        this.store.set(account.id, account);
        return account;
    }

    async update(id: string, data: UpdateAccountData): Promise<Account | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        const updated: Account = {
            ...existing,
            ...Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== undefined),
            ),
            updatedAt: new Date(),
        };
        this.store.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<Account | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        this.store.delete(id);
        return existing;
    }
}
