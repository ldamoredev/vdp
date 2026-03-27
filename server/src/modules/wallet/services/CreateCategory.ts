import { Category, CreateCategoryData } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';

export class CreateCategory {
    constructor(private readonly categories: CategoryRepository) {}

    async execute(data: CreateCategoryData): Promise<Category> {
        return this.categories.create(data);
    }
}
