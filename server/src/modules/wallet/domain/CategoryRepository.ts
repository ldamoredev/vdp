import { Category, CreateCategoryData, UpdateCategoryData } from './Category';

export abstract class CategoryRepository {
    abstract findAll(userId: string, type?: string): Promise<Category[]>;
    abstract findById(userId: string, id: string): Promise<Category | null>;
    abstract create(userId: string, data: CreateCategoryData): Promise<Category>;
    abstract update(userId: string, id: string, data: UpdateCategoryData): Promise<Category | null>;
}
