import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { UserRepository } from '../../domain/UserRepository';
import { SessionRepository } from '../../domain/SessionRepository';
import { AuditLogRepository } from '../../domain/AuditLogRepository';
import { DrizzleUserRepository } from './DrizzleUserRepository';
import { DrizzleSessionRepository } from './DrizzleSessionRepository';
import { DrizzleAuditLogRepository } from './DrizzleAuditLogRepository';

export function registerAuthRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(UserRepository, () => new DrizzleUserRepository(db));
    registry.register(SessionRepository, () => new DrizzleSessionRepository(db));
    registry.register(AuditLogRepository, () => new DrizzleAuditLogRepository(db));
}
