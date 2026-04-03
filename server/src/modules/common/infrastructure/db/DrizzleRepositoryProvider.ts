import { Database } from '../../base/db/Database';
import { TaskRepository } from '../../../tasks/domain/TaskRepository';
import { DrizzleTaskRepository } from '../../../tasks/infrastructure/db/DrizzleTaskRepository';
import { TaskNoteRepository } from '../../../tasks/domain/TaskNoteRepository';
import { DrizzleTaskNoteRepository } from '../../../tasks/infrastructure/db/DrizzleTaskNoteRepository';
import { RepositoryProvider } from '../../base/db/RepositoryProvider';
import { AgentRepository } from '../../base/agents/AgentRepository';
import { DrizzleAgentRepository } from '../agents/DrizzleAgentRepository';
import { TaskEmbeddingRepository } from '../../../tasks/domain/TaskEmbeddingRepository';
import { DrizzleTaskEmbeddingRepository } from '../../../tasks/infrastructure/db/DrizzleTaskEmbeddingRepository';
import { AccountRepository } from '../../../wallet/domain/AccountRepository';
import { DrizzleAccountRepository } from '../../../wallet/infrastructure/db/DrizzleAccountRepository';
import { TransactionRepository } from '../../../wallet/domain/TransactionRepository';
import { DrizzleTransactionRepository } from '../../../wallet/infrastructure/db/DrizzleTransactionRepository';
import { CategoryRepository } from '../../../wallet/domain/CategoryRepository';
import { DrizzleCategoryRepository } from '../../../wallet/infrastructure/db/DrizzleCategoryRepository';
import { SavingsGoalRepository } from '../../../wallet/domain/SavingsGoalRepository';
import { DrizzleSavingsGoalRepository } from '../../../wallet/infrastructure/db/DrizzleSavingsGoalRepository';
import { InvestmentRepository } from '../../../wallet/domain/InvestmentRepository';
import { DrizzleInvestmentRepository } from '../../../wallet/infrastructure/db/DrizzleInvestmentRepository';
import { ExchangeRateRepository } from '../../../wallet/domain/ExchangeRateRepository';
import { DrizzleExchangeRateRepository } from '../../../wallet/infrastructure/db/DrizzleExchangeRateRepository';
import { UserRepository } from '../../base/auth/UserRepository';
import { SessionRepository } from '../../base/auth/SessionRepository';
import { AuditLogRepository } from '../../base/auth/AuditLogRepository';
import { DrizzleUserRepository } from '../auth/DrizzleUserRepository';
import { DrizzleSessionRepository } from '../auth/DrizzleSessionRepository';
import { DrizzleAuditLogRepository } from '../auth/DrizzleAuditLogRepository';

export class DrizzleRepositoryProvider extends RepositoryProvider {
    constructor(private db: Database) {
        super();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- abstract constructor spread requires `any`
    protected create<T>(token: abstract new (...args: any[]) => T): T {
        switch (token) {
            case TaskRepository:
                return new DrizzleTaskRepository(this.db) as T;
            case TaskNoteRepository:
                return new DrizzleTaskNoteRepository(this.db) as T;
            case TaskEmbeddingRepository:
                return new DrizzleTaskEmbeddingRepository(this.db) as T;
            case AgentRepository:
                return new DrizzleAgentRepository(this.db) as T;
            case AccountRepository:
                return new DrizzleAccountRepository(this.db) as T;
            case TransactionRepository:
                return new DrizzleTransactionRepository(this.db) as T;
            case CategoryRepository:
                return new DrizzleCategoryRepository(this.db) as T;
            case SavingsGoalRepository:
                return new DrizzleSavingsGoalRepository(this.db) as T;
            case InvestmentRepository:
                return new DrizzleInvestmentRepository(this.db) as T;
            case ExchangeRateRepository:
                return new DrizzleExchangeRateRepository(this.db) as T;
            case UserRepository:
                return new DrizzleUserRepository(this.db) as T;
            case SessionRepository:
                return new DrizzleSessionRepository(this.db) as T;
            case AuditLogRepository:
                return new DrizzleAuditLogRepository(this.db) as T;
            default:
                throw new Error(`${token.name} not implemented`);
        }
    }
}
