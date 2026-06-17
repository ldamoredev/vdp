import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';
import { MoodCheckIn as WireMoodCheckIn } from '@vdp/shared';

import { todayISO } from '../../common/base/time/dates';
import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { MoodCheckIn, MoodCheckInRepository } from '../domain/MoodCheckInRepository';

export type SaveMoodCheckInInput = {
    readonly date?: string;
    readonly mood: number;
    readonly energy: number;
};

export class SaveMoodCheckInCommand extends Command<WireMoodCheckIn> {
    constructor(readonly input: SaveMoodCheckInInput) {
        super();
    }
}

export class SaveMoodCheckInCommandHandler implements RequestHandler<SaveMoodCheckInCommand, WireMoodCheckIn> {
    constructor(private readonly checkIns: MoodCheckInRepository) {}

    async handle(command: SaveMoodCheckInCommand, identity: Identity): Promise<WireMoodCheckIn> {
        const { userId } = requireUserIdentity(identity);
        const checkIn = await this.checkIns.saveMoodCheckIn(userId, {
            date: command.input.date ?? todayISO(),
            mood: command.input.mood,
            energy: command.input.energy,
        });
        return serializeMoodCheckIn(checkIn);
    }
}

export function serializeMoodCheckIn(checkIn: MoodCheckIn): WireMoodCheckIn {
    return {
        id: checkIn.id,
        date: checkIn.date,
        mood: checkIn.mood,
        energy: checkIn.energy,
        createdAt: checkIn.createdAt.toISOString(),
        updatedAt: checkIn.updatedAt.toISOString(),
    };
}
