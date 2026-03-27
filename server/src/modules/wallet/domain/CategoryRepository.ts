import { Category, CreateCategoryData, UpdateCategoryData } from './Category';

export abstract class CategoryRepository {
    abstract findAll(type?: string): Promise<Category[]>;
    abstract findById(id: string): Promise<Category | null>;
    abstract create(data: CreateCategoryData): Promise<Category>;
    abstract update(id: string, data: UpdateCategoryData): Promise<Category | null>;
}
