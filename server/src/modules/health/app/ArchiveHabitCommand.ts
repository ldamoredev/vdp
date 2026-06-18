import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../common/http/errors';
import { HabitSnapshot } from '../domain/Habit';
import { HabitRepository } from '../domain/HabitRepository';

export class ArchiveHabitCommand extends Command<HabitSnapshot> {
    constructor(readonly habitId: string) {
        super();
    }
}

export class ArchiveHabitCommandHandler implements RequestHandler<ArchiveHabitCommand, HabitSnapshot> {
    constructor(private readonly habits: HabitRepository) {}

    async handle(command: ArchiveHabitCommand, identity: Identity): Promise<HabitSnapshot> {
        const { userId } = requireUserIdentity(identity);
        const habit = await this.habits.getHabit(userId, command.habitId);
        if (!habit) throw new NotFoundHttpError('Habit not found');
        if (!habit.isArchived()) {
            habit.archive();
            await this.habits.save(userId, habit);
        }
        return habit.toSnapshot();
    }
}
