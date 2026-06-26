import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Client } from '../domain/Client';
import { ClientRepository } from '../domain/ClientRepository';

export type CreateClientInput = {
    readonly name: string;
};

export class CreateClientCommand extends Command<Client> {
    constructor(readonly input: CreateClientInput) {
        super();
    }
}

export class CreateClientCommandHandler implements RequestHandler<CreateClientCommand, Client> {
    constructor(private readonly clients: ClientRepository) {}

    async handle(command: CreateClientCommand, identity: Identity): Promise<Client> {
        const { userId } = requireUserIdentity(identity);
        return this.clients.createClient(userId, { name: command.input.name });
    }
}
