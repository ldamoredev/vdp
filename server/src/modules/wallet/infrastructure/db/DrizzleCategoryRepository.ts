import { Category, CreateCategoryData, UpdateCategoryData } from '../../domain/Category';
import { CategoryRepository } from '../../domain/CategoryRepository';
import { Database } from '../../../common/base/db/Database';
import { categories } from '../../schema';
import { and, eq } from 'drizzle-orm';
import { getScopedUserId } from '../../../common/http/request-auth';

export class DrizzleCategoryRepository extends CategoryRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async findAll(type?: string): Promise<Category[]> {
        const ownerUserId = getScopedUserId();
        if (type) {
            return this.db.query
                .select()
                .from(categories)
                .where(and(eq(categories.type, type), eq(categories.ownerUserId, ownerUserId)));
        }
        return this.db.query
            .select()
            .from(categories)
            .where(eq(categories.ownerUserId, ownerUserId));
    }

    async findById(id: string): Promise<Category | null> {
        const [row] = await this.db.query
            .select()
            .from(categories)
            .where(and(eq(categories.id, id), eq(categories.ownerUserId, getScopedUserId())));

        return row ?? null;
    }

    async create(data: CreateCategoryData): Promise<Category> {
        const [row] = await this.db.query
            .insert(categories)
            .values({
                ownerUserId: getScopedUserId(),
                name: data.name,
                type: data.type,
                icon: data.icon ?? null,
                parentId: data.parentId ?? null,
            })
            .returning();

        return row;
    }

    private static readonly UPDATABLE_FIELDS = ['name', 'type', 'icon', 'parentId'] as const;

    async update(id: string, data: UpdateCategoryData): Promise<Category | null> {
        const updateData: Record<string, unknown> = {};
        for (const field of DrizzleCategoryRepository.UPDATABLE_FIELDS) {
            if (data[field] !== undefined) updateData[field] = data[field];
        }

        if (Object.keys(updateData).length === 0) {
            return this.findById(id);
        }

        const [updated] = await this.db.query
            .update(categories)
            .set(updateData)
            .where(and(eq(categories.id, id), eq(categories.ownerUserId, getScopedUserId())))
            .returning();

        return updated ?? null;
    }
}
