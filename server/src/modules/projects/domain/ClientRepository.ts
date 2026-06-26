import { Client } from './Client';

export type CreateClientData = {
    readonly name: string;
};

export abstract class ClientRepository {
    abstract createClient(userId: string, data: CreateClientData): Promise<Client>;
    abstract getClient(userId: string, id: string): Promise<Client | null>;
    abstract listClients(userId: string): Promise<Client[]>;
    abstract save(userId: string, client: Client): Promise<Client>;
}
