import { Category, CreateCategoryData, UpdateCategoryData } from '../../domain/Category';
import { CategoryRepository } from '../../domain/CategoryRepository';
import { Database } from '../../../common/base/db/Database';
import { categories } from '../../schema';
import { eq } from 'drizzle-orm';

export class DrizzleCategoryRepository extends CategoryRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async findAll(type?: string): Promise<Category[]> {
        if (type) {
            return this.db.query
                .select()
                .from(categories)
                .where(eq(categories.type, type));
        }
        return this.db.query.select().from(categories);
    }

    async findById(id: string): Promise<Category | null> {
        const [row] = await this.db.query
            .select()
            .from(categories)
            .where(eq(categories.id, id));

        return row ?? null;
    }

    async create(data: CreateCategoryData): Promise<Category> {
        const [row] = await this.db.query
            .insert(categories)
            .values({
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
            .where(eq(categories.id, id))
            .returning();

        return updated ?? null;
    }
}
