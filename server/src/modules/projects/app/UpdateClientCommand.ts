import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Client } from '../domain/Client';
import { ClientRepository } from '../domain/ClientRepository';

export type UpdateClientInput = {
    readonly name?: string;
};

export class UpdateClientCommand extends Command<Client | null> {
    constructor(
        readonly id: string,
        readonly input: UpdateClientInput,
    ) {
        super();
    }
}

export class UpdateClientCommandHandler implements RequestHandler<UpdateClientCommand, Client | null> {
    constructor(private readonly clients: ClientRepository) {}

    async handle(command: UpdateClientCommand, identity: Identity): Promise<Client | null> {
        const { userId } = requireUserIdentity(identity);
        const client = await this.clients.getClient(userId, command.id);
        if (!client) return null;
        if (command.input.name !== undefined) client.rename(command.input.name);
        return this.clients.save(userId, client);
    }
}
