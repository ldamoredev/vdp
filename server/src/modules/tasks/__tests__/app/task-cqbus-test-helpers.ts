import { Identity } from '@nbottarini/cqbus';
import { vi } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { FakeProjectRepository } from '../../../projects/__tests__/fakes/FakeProjectRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { DetectRepeatPattern } from '../../services/DetectRepeatPattern';
import { EmbedTask } from '../../services/EmbedTask';
import { FindSimilarTasks } from '../../services/FindSimilarTasks';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';

export const userId = 'user-1';
export const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
export const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

export type TasksCQBusTestContext = {
    readonly tasks: FakeTaskRepository;
    readonly projects: FakeProjectRepository;
    readonly notes: FakeTaskNoteRepository;
    readonly embeddings: FakeTaskEmbeddingRepository;
    readonly embeddingProvider: FakeEmbeddingProvider;
    readonly embedTask: EmbedTask;
    readonly findSimilarTasks: FindSimilarTasks;
    readonly detectRepeatPattern: DetectRepeatPattern;
    readonly eventBus: EventBus;
    readonly insightsStore: TaskInsightsStore;
    readonly executeInBackground: ReturnType<typeof vi.fn>;
    readonly findSimilar: ReturnType<typeof vi.fn>;
    readonly detectRepeat: ReturnType<typeof vi.fn>;
};

export function setupTasksCQBusTest(): TasksCQBusTestContext {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 17, 12, 0, 0));

    const executeInBackground = vi.fn();
    const findSimilar = vi.fn().mockResolvedValue([]);
    const detectRepeat = vi.fn().mockResolvedValue(undefined);

    return {
        tasks: new FakeTaskRepository(),
        projects: new FakeProjectRepository(),
        notes: new FakeTaskNoteRepository(),
        embeddings: new FakeTaskEmbeddingRepository(),
        embeddingProvider: new FakeEmbeddingProvider(3),
        embedTask: { executeInBackground } as unknown as EmbedTask,
        findSimilarTasks: { execute: findSimilar } as unknown as FindSimilarTasks,
        detectRepeatPattern: { execute: detectRepeat } as unknown as DetectRepeatPattern,
        eventBus: new EventBus(),
        insightsStore: new TaskInsightsStore(),
        executeInBackground,
        findSimilar,
        detectRepeat,
    };
}
