import { beforeEach, describe, expect, it } from 'vitest';

import { todayISO } from '../../../common/base/time/dates';
import { createTask } from '../fakes/task-factory';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { GetCarryOverRate } from '../../services/GetCarryOverRate';
import { GetDayStats } from '../../services/GetDayStats';
import { GetPlanningContext } from '../../services/GetPlanningContext';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';

describe('GetPlanningContext', () => {
    const userId = 'user-a';
    let repository: FakeTaskRepository;
    let insightsStore: TaskInsightsStore;
    let service: GetPlanningContext;

    beforeEach(() => {
        repository = new FakeTaskRepository();
        insightsStore = new TaskInsightsStore();
        service = new GetPlanningContext(
            repository,
            new GetDayStats(repository),
            new GetCarryOverRate(repository),
            insightsStore,
        );
    });

    it('returns only the requesting user insight snapshot', async () => {
        repository.seed([
            createTask({ scheduledDate: todayISO(), status: 'pending', carryOverCount: 3 }),
        ]);
        insightsStore.addInsight({
            userId: userId,
            type: 'achievement',
            title: 'Insight A1',
            message: 'Mensaje A1',
        });
        insightsStore.addInsight({
            userId: 'user-b',
            type: 'warning',
            title: 'Insight B1',
            message: 'Mensaje B1',
        });

        const result = await service.execute(userId);

        expect(result.insights).toEqual({
            unread: [
                expect.objectContaining({
                    title: 'Insight A1',
                }),
            ],
            streak: {
                current: 0,
                best: 0,
                lastCompletedDate: null,
            },
            totalInsights: 1,
        });
    });
});
