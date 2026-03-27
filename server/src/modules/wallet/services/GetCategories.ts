import { Category } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';

export class GetCategories {
    constructor(private readonly categories: CategoryRepository) {}

    async execute(type?: string): Promise<Category[]> {
        return this.categories.findAll(type);
    }
}
