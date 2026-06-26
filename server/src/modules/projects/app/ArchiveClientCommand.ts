import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Client } from '../domain/Client';
import { ClientRepository } from '../domain/ClientRepository';

export class ArchiveClientCommand extends Command<Client | null> {
    constructor(readonly id: string) {
        super();
    }
}

export class ArchiveClientCommandHandler implements RequestHandler<ArchiveClientCommand, Client | null> {
    constructor(private readonly clients: ClientRepository) {}

    async handle(command: ArchiveClientCommand, identity: Identity): Promise<Client | null> {
        const { userId } = requireUserIdentity(identity);
        const client = await this.clients.getClient(userId, command.id);
        if (!client) return null;
        client.archive();
        return this.clients.save(userId, client);
    }
}
