import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Category } from '../domain/Category';
import { CategoryRepository } from '../domain/CategoryRepository';

export class GetCategoriesQuery extends Query<Category[]> {
    constructor(readonly type?: string) {
        super();
    }
}

export class GetCategoriesQueryHandler implements RequestHandler<GetCategoriesQuery, Category[]> {
    constructor(private readonly categories: CategoryRepository) {}

    async handle(query: GetCategoriesQuery, identity: Identity): Promise<Category[]> {
        const { userId } = requireUserIdentity(identity);
        return this.categories.findAll(userId, query.type);
    }
}
