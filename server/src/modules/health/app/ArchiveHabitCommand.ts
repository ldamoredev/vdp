import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { HabitSnapshot } from '../domain/Habit';
import { HabitRepository } from '../domain/HabitRepository';
import { ArchiveHabit } from '../services/ArchiveHabit';

export class ArchiveHabitCommand extends Command<HabitSnapshot> {
    constructor(readonly habitId: string) {
        super();
    }
}

export class ArchiveHabitCommandHandler implements RequestHandler<ArchiveHabitCommand, HabitSnapshot> {
    constructor(private readonly habits: HabitRepository) {}

    async handle(command: ArchiveHabitCommand, identity: Identity): Promise<HabitSnapshot> {
        const { userId } = requireUserIdentity(identity);
        const habit = await new ArchiveHabit(this.habits).execute(userId, command.habitId);
        return habit.toSnapshot();
    }
}
