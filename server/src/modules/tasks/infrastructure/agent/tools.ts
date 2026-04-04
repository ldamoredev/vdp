import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { createTaskInsightTools } from './tools/insight-tools';
import { createTaskIntelligenceTools } from './tools/intelligence-tools';
import { createTaskManagementTools } from './tools/management-tools';
import { createTaskReviewTools } from './tools/review-tools';
import { createTaskTransitionTools } from './tools/transition-tools';
import { AuthContextStorage } from '../../../common/auth/AuthContextStorage';

export class TasksTools {
    static createTasksTools(services: ServiceProvider, authContextStorage: AuthContextStorage, insightsStore?: TaskInsightsStore) {
        return [
            ...createTaskManagementTools(services, authContextStorage),
            ...createTaskTransitionTools(services, authContextStorage),
            ...createTaskReviewTools(services, authContextStorage),
            ...createTaskIntelligenceTools(services, authContextStorage),
            ...createTaskInsightTools(insightsStore),
        ];
    }
}
