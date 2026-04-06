import { EventBus } from '../../common/base/event-bus/EventBus';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { TaskInsightsStore } from './TaskInsightsStore';
import {
    DailyAllCompletedPayload,
    TaskCompletedPayload,
    TaskInsightFactory,
    TaskRepeatDetectedPayload,
    TasksOverloadedPayload,
    TaskStuckPayload,
} from './TaskInsightFactory';

/**
 * Handles all task domain events.
 * Each handler reacts to a specific event and performs side-effects:
 * - Tracks completion streaks (gamification)
 * - Generates proactive insights and suggestions
 * - Surfaces warnings for stuck/overloaded states
 *
 * Insights are stored in TaskInsightsStore and surfaced to the user
 * via the agent's `get_insights` tool.
 */
export class TaskEventHandlers implements EventSubscriber {
    constructor(
        private readonly eventBus: EventBus,
        private readonly insightsStore: TaskInsightsStore,
    ) {}

    subscribe(): void {
        this.eventBus.on('tasks.task.completed', (event) =>
            this.onTaskCompleted(event as DomainEvent<TaskCompletedPayload>),
        );
        this.eventBus.on('tasks.daily.all_completed', (event) =>
            this.onDailyAllCompleted(event as DomainEvent<DailyAllCompletedPayload>),
        );
        this.eventBus.on('tasks.task.stuck', (event) =>
            this.onTaskStuck(event as DomainEvent<TaskStuckPayload>),
        );
        this.eventBus.on('tasks.overloaded', (event) =>
            this.onTasksOverloaded(event as DomainEvent<TasksOverloadedPayload>),
        );
        this.eventBus.on('tasks.task.repeat_detected', (event) =>
            this.onTaskRepeatDetected(event as DomainEvent<TaskRepeatDetectedPayload>),
        );
    }

    private async onTaskCompleted(event: DomainEvent<TaskCompletedPayload>): Promise<void> {
        this.insightsStore.addInsight(TaskInsightFactory.taskCompleted(event.payload));
    }

    private async onDailyAllCompleted(event: DomainEvent<DailyAllCompletedPayload>): Promise<void> {
        this.insightsStore.recordPerfectDay(event.payload.userId, event.payload.date);
        const streak = this.insightsStore.getStreak(event.payload.userId);
        this.insightsStore.addInsight(TaskInsightFactory.dailyAllCompleted(event.payload, streak));
    }

    private async onTaskStuck(event: DomainEvent<TaskStuckPayload>): Promise<void> {
        this.insightsStore.addInsight(TaskInsightFactory.taskStuck(event.payload));
    }

    private async onTasksOverloaded(event: DomainEvent<TasksOverloadedPayload>): Promise<void> {
        this.insightsStore.addInsight(TaskInsightFactory.tasksOverloaded(event.payload));
    }

    private async onTaskRepeatDetected(event: DomainEvent<TaskRepeatDetectedPayload>): Promise<void> {
        this.insightsStore.addInsight(TaskInsightFactory.taskRepeatDetected(event.payload));
    }
}
