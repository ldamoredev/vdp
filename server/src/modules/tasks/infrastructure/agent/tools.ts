import { CQBus } from '@nbottarini/cqbus';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { createTaskInsightTools } from './tools/insight-tools';
import { createTaskIntelligenceTools } from './tools/intelligence-tools';
import { createTaskManagementTools } from './tools/management-tools';
import { createTaskReviewTools } from './tools/review-tools';
import { createTaskTransitionTools } from './tools/transition-tools';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';

export class TasksTools {
    static createTasksTools(bus: CQBus, authContextStorage: AuthContextStorage, insightsStore?: TaskInsightsStore) {
        return [
            ...createTaskManagementTools(bus, authContextStorage),
            ...createTaskTransitionTools(bus, authContextStorage),
            ...createTaskReviewTools(bus, authContextStorage),
            ...createTaskIntelligenceTools(bus, authContextStorage),
            ...createTaskInsightTools(authContextStorage, insightsStore),
        ];
    }
}
