import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { HabitRepository } from '../domain/HabitRepository';
import { CompleteHabitDay } from '../services/CompleteHabitDay';

export class CompleteHabitDayCommand extends Command<{ logged: boolean }> {
    constructor(
        readonly habitId: string,
        readonly date?: string,
    ) {
        super();
    }
}

export class CompleteHabitDayCommandHandler implements RequestHandler<CompleteHabitDayCommand, { logged: boolean }> {
    constructor(
        private readonly habits: HabitRepository,
        private readonly eventBus: EventBus,
    ) {}

    async handle(command: CompleteHabitDayCommand, identity: Identity): Promise<{ logged: boolean }> {
        const { userId } = requireUserIdentity(identity);
        return new CompleteHabitDay(this.habits, this.eventBus).execute(userId, command.habitId, command.date);
    }
}
