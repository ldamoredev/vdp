import { Habit } from '../domain/Habit';
import { CreateHabitData, HabitRepository } from '../domain/HabitRepository';
import { DomainHttpError } from '../../common/http/errors';

export function normalizeCreateHabitData(data: CreateHabitData): Required<CreateHabitData> {
    const cadence = data.cadence ?? 'daily';
    if (cadence === 'daily') {
        return {
            name: data.name,
            emoji: data.emoji ?? null,
            cadence: 'daily',
            weeklyTarget: null,
        };
    }

    if (cadence !== 'weekly') {
        throw new DomainHttpError('Invalid habit cadence');
    }

    const weeklyTarget = data.weeklyTarget;
    if (typeof weeklyTarget !== 'number' || !Number.isInteger(weeklyTarget) || weeklyTarget < 1 || weeklyTarget > 7) {
        throw new DomainHttpError('Weekly target must be between 1 and 7');
    }

    return {
        name: data.name,
        emoji: data.emoji ?? null,
        cadence: 'weekly',
        weeklyTarget,
    };
}

export class CreateHabit {
    constructor(private readonly habits: HabitRepository) {}

    async execute(userId: string, data: CreateHabitData): Promise<Habit> {
        return this.habits.createHabit(userId, normalizeCreateHabitData(data));
    }
}
