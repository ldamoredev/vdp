import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { HabitRepository } from '../domain/HabitRepository';
import { UncompleteHabitDay } from '../services/UncompleteHabitDay';

export class UncompleteHabitDayCommand extends Command<{ removed: boolean }> {
    constructor(
        readonly habitId: string,
        readonly date?: string,
    ) {
        super();
    }
}

export class UncompleteHabitDayCommandHandler implements RequestHandler<UncompleteHabitDayCommand, { removed: boolean }> {
    constructor(private readonly habits: HabitRepository) {}

    async handle(command: UncompleteHabitDayCommand, identity: Identity): Promise<{ removed: boolean }> {
        const { userId } = requireUserIdentity(identity);
        return new UncompleteHabitDay(this.habits).execute(userId, command.habitId, command.date);
    }
}
