import { Category, CreateCategoryData, UpdateCategoryData } from '../../domain/Category';
import { CategoryRepository } from '../../domain/CategoryRepository';
import { Database } from '../../../common/base/db/Database';
import { categories } from '../../schema';
import { and, eq } from 'drizzle-orm';

export class DrizzleCategoryRepository extends CategoryRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async findAll(userId: string, type?: string): Promise<Category[]> {
        if (type) {
            return this.db.query
                .select()
                .from(categories)
                .where(and(eq(categories.type, type), eq(categories.ownerUserId, userId)));
        }
        return this.db.query
            .select()
            .from(categories)
            .where(eq(categories.ownerUserId, userId));
    }

    async findById(userId: string, id: string): Promise<Category | null> {
        const [row] = await this.db.query
            .select()
            .from(categories)
            .where(and(eq(categories.id, id), eq(categories.ownerUserId, userId)));

        return row ?? null;
    }

    async create(userId: string, data: CreateCategoryData): Promise<Category> {
        const [row] = await this.db.query
            .insert(categories)
            .values({
                ownerUserId: userId,
                name: data.name,
                type: data.type,
                icon: data.icon ?? null,
                parentId: data.parentId ?? null,
            })
            .returning();

        return row;
    }

    private static readonly UPDATABLE_FIELDS = ['name', 'type', 'icon', 'parentId'] as const;

    async update(userId: string, id: string, data: UpdateCategoryData): Promise<Category | null> {
        const updateData: Record<string, unknown> = {};
        for (const field of DrizzleCategoryRepository.UPDATABLE_FIELDS) {
            if (data[field] !== undefined) updateData[field] = data[field];
        }

        if (Object.keys(updateData).length === 0) {
            return this.findById(userId, id);
        }

        const [updated] = await this.db.query
            .update(categories)
            .set(updateData)
            .where(and(eq(categories.id, id), eq(categories.ownerUserId, userId)))
            .returning();

        return updated ?? null;
    }
}
