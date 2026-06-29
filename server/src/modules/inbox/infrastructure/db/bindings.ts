import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { InboxItemRepository } from '../../domain/InboxItemRepository';
import { DrizzleInboxItemRepository } from './DrizzleInboxItemRepository';

export function registerInboxRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(InboxItemRepository, () => new DrizzleInboxItemRepository(db));
}
