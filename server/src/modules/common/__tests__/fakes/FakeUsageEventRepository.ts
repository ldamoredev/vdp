import { UsageEvent, UsageEventRepository } from '../../base/usage/UsageEventRepository';

export class FakeUsageEventRepository extends UsageEventRepository {
    events: UsageEvent[] = [];
    failNext = false;

    async record(event: UsageEvent): Promise<void> {
        if (this.failNext) throw new Error('usage store down');
        this.events.push(event);
    }
}
