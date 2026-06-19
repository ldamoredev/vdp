import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Category, CreateCategoryData } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';

export class CreateCategoryCommand extends Command<Category> {
    constructor(readonly input: CreateCategoryData) {
        super();
    }
}

export class CreateCategoryCommandHandler implements RequestHandler<CreateCategoryCommand, Category> {
    constructor(private readonly categories: CategoryRepository) {}

    async handle(command: CreateCategoryCommand, identity: Identity): Promise<Category> {
        const { userId } = requireUserIdentity(identity);
        return this.categories.create(userId, command.input);
    }
}
