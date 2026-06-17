import { Database } from '../../../common/base/db/Database';
import { RepositoryRegistry } from '../../../common/base/db/RepositoryRegistry';
import { FileStorage } from '../../../common/base/storage/FileStorage';
import { PostgresFileStorage } from '../../../common/infrastructure/storage/PostgresFileStorage';
import { HabitRepository } from '../../domain/HabitRepository';
import { CounterRepository } from '../../domain/CounterRepository';
import { GoalRepository } from '../../domain/GoalRepository';
import { MoodCheckInRepository } from '../../domain/MoodCheckInRepository';
import { MedicalRepository } from '../../domain/medical/MedicalRepository';
import { DrizzleHabitRepository } from './DrizzleHabitRepository';
import { DrizzleCounterRepository } from './DrizzleCounterRepository';
import { DrizzleGoalRepository } from './DrizzleGoalRepository';
import { DrizzleMoodCheckInRepository } from './DrizzleMoodCheckInRepository';
import { DrizzleMedicalRepository } from './DrizzleMedicalRepository';

export function registerHealthRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(HabitRepository, () => new DrizzleHabitRepository(db));
    registry.register(CounterRepository, () => new DrizzleCounterRepository(db));
    registry.register(GoalRepository, () => new DrizzleGoalRepository(db));
    registry.register(MoodCheckInRepository, () => new DrizzleMoodCheckInRepository(db));
    registry.register(MedicalRepository, () => new DrizzleMedicalRepository(db));
    registry.register(FileStorage, () => new PostgresFileStorage(db));
}
