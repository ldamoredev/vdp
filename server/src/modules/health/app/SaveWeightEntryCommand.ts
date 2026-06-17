import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';
import { WeightEntry as WireWeightEntry } from '@vdp/shared';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { todayISO } from '../../common/base/time/dates';
import { WeightEntry, WeightRepository } from '../domain/WeightRepository';

export type SaveWeightEntryInput = {
    readonly date?: string;
    readonly weightKg: string;
};

export class SaveWeightEntryCommand extends Command<WireWeightEntry> {
    constructor(readonly input: SaveWeightEntryInput) {
        super();
    }
}

export class SaveWeightEntryCommandHandler implements RequestHandler<SaveWeightEntryCommand, WireWeightEntry> {
    constructor(private readonly weights: WeightRepository) {}

    async handle(command: SaveWeightEntryCommand, identity: Identity): Promise<WireWeightEntry> {
        const { userId } = requireUserIdentity(identity);
        const entry = await this.weights.saveWeightEntry(userId, {
            date: command.input.date ?? todayISO(),
            weightKg: command.input.weightKg,
        });
        return serializeWeightEntry(entry);
    }
}

export function serializeWeightEntry(entry: WeightEntry): WireWeightEntry {
    return {
        id: entry.id,
        date: entry.date,
        weightKg: entry.weightKg,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
    };
}
