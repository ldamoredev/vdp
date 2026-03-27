import {
    Transaction,
    CreateTransactionData,
    UpdateTransactionData,
    TransactionFilters,
    PagedTransactions,
} from '../../domain/Transaction';
import { TransactionRepository } from '../../domain/TransactionRepository';
import { randomUUID } from 'crypto';

export class FakeTransactionRepository extends TransactionRepository {
    private store = new Map<string, Transaction>();

    // ─── Test helpers ──────────────────────────────────

    seed(transactions: Transaction[]): void {
        for (const tx of transactions) {
            this.store.set(tx.id, tx);
        }
    }

    clear(): void {
        this.store.clear();
    }

    get size(): number {
        return this.store.size;
    }

    // ─── CRUD ──────────────────────────────────────────

    async list(filters: TransactionFilters): Promise<PagedTransactions> {
        let items = Array.from(this.store.values());

        if (filters.accountId) items = items.filter(t => t.accountId === filters.accountId);
        if (filters.categoryId) items = items.filter(t => t.categoryId === filters.categoryId);
        if (filters.type) items = items.filter(t => t.type === filters.type);
        if (filters.from) items = items.filter(t => t.date >= filters.from!);
        if (filters.to) items = items.filter(t => t.date <= filters.to!);
        if (filters.search) {
            const term = filters.search.toLowerCase();
            items = items.filter(t => t.description?.toLowerCase().includes(term));
        }

        items.sort((a, b) => b.date.localeCompare(a.date));

        const total = items.length;
        const limit = filters.limit ?? 50;
        const offset = filters.offset ?? 0;

        return {
            transactions: items.slice(offset, offset + limit),
            total,
            limit,
            offset,
        };
    }

    async findById(id: string): Promise<Transaction | null> {
        return this.store.get(id) ?? null;
    }

    async create(data: CreateTransactionData): Promise<Transaction> {
        const now = new Date();
        const tx: Transaction = {
            id: randomUUID(),
            accountId: data.accountId,
            categoryId: data.categoryId ?? null,
            type: data.type,
            amount: data.amount,
            currency: data.currency,
            description: data.description ?? null,
            date: data.date,
            transferToAccountId: data.transferToAccountId ?? null,
            tags: data.tags ?? [],
            createdAt: now,
            updatedAt: now,
        };
        this.store.set(tx.id, tx);
        return tx;
    }

    async update(id: string, data: UpdateTransactionData): Promise<Transaction | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        const updated: Transaction = {
            ...existing,
            ...Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== undefined),
            ),
            updatedAt: new Date(),
        };
        this.store.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<Transaction | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        this.store.delete(id);
        return existing;
    }

    async sumByAccountId(accountId: string): Promise<string> {
        let balance = 0;
        for (const tx of this.store.values()) {
            if (tx.accountId !== accountId) continue;
            const amount = parseFloat(tx.amount);
            if (tx.type === 'income') balance += amount;
            if (tx.type === 'expense') balance -= amount;
        }
        return balance.toString();
    }

    async sumByDateRange(from: string, to: string, accountId?: string): Promise<string> {
        let balance = 0;
        for (const tx of this.store.values()) {
            if (tx.date < from || tx.date > to) continue;
            if (accountId && tx.accountId !== accountId) continue;
            const amount = parseFloat(tx.amount);
            if (tx.type === 'income') balance += amount;
            if (tx.type === 'expense') balance -= amount;
        }
        return balance.toString();
    }
}
