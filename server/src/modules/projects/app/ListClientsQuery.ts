import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { Client } from '../domain/Client';
import { ClientRepository } from '../domain/ClientRepository';

export class ListClientsQuery extends Query<Client[]> {}

export class ListClientsQueryHandler implements RequestHandler<ListClientsQuery, Client[]> {
    constructor(private readonly clients: ClientRepository) {}

    async handle(_query: ListClientsQuery, identity: Identity): Promise<Client[]> {
        const { userId } = requireUserIdentity(identity);
        return this.clients.listClients(userId);
    }
}
