import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { createTaskInsightTools } from './tools/insight-tools';
import { createTaskIntelligenceTools } from './tools/intelligence-tools';
import { createTaskManagementTools } from './tools/management-tools';
import { createTaskReviewTools } from './tools/review-tools';
import { createTaskTransitionTools } from './tools/transition-tools';

export class TasksTools {
    static createTasksTools(services: ServiceProvider, insightsStore?: TaskInsightsStore) {
        return [
            ...createTaskManagementTools(services),
            ...createTaskTransitionTools(services),
            ...createTaskReviewTools(services),
            ...createTaskIntelligenceTools(services),
            ...createTaskInsightTools(insightsStore),
        ];
    }
}
