import { Category, CreateCategoryData, UpdateCategoryData } from '../../domain/Category';
import { CategoryRepository } from '../../domain/CategoryRepository';
import { randomUUID } from 'crypto';

export class FakeCategoryRepository extends CategoryRepository {
    private store = new Map<string, Category>();

    // ─── Test helpers ──────────────────────────────────

    seed(categories: Category[]): void {
        for (const cat of categories) {
            this.store.set(cat.id, cat);
        }
    }

    clear(): void {
        this.store.clear();
    }

    get size(): number {
        return this.store.size;
    }

    // ─── CRUD ──────────────────────────────────────────

    async findAll(type?: string): Promise<Category[]> {
        const all = Array.from(this.store.values());
        if (type) return all.filter(c => c.type === type);
        return all;
    }

    async findById(id: string): Promise<Category | null> {
        return this.store.get(id) ?? null;
    }

    async create(data: CreateCategoryData): Promise<Category> {
        const category: Category = {
            id: randomUUID(),
            name: data.name,
            type: data.type,
            icon: data.icon ?? null,
            parentId: data.parentId ?? null,
            createdAt: new Date(),
        };
        this.store.set(category.id, category);
        return category;
    }

    async update(id: string, data: UpdateCategoryData): Promise<Category | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        const updated: Category = {
            ...existing,
            ...Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== undefined),
            ),
        };
        this.store.set(id, updated);
        return updated;
    }
}
