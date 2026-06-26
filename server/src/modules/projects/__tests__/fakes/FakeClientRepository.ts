import { randomUUID } from 'crypto';

import { Client, type ClientSnapshot } from '../../domain/Client';
import { ClientRepository, type CreateClientData } from '../../domain/ClientRepository';

export class FakeClientRepository extends ClientRepository {
    private store = new Map<string, ClientSnapshot>();
    lastCreateUserId: string | null = null;

    async createClient(userId: string, data: CreateClientData): Promise<Client> {
        this.lastCreateUserId = userId;
        const now = new Date();
        const client = Client.fromSnapshot({
            id: randomUUID(),
            name: data.name,
            status: 'active',
            archivedAt: null,
            createdAt: now,
            updatedAt: now,
        });
        this.store.set(client.id, client.toSnapshot());
        return client;
    }

    async getClient(_userId: string, id: string): Promise<Client | null> {
        const snapshot = this.store.get(id);
        return snapshot ? Client.fromSnapshot(snapshot) : null;
    }

    async listClients(_userId: string): Promise<Client[]> {
        return Array.from(this.store.values()).map(Client.fromSnapshot);
    }

    async save(_userId: string, client: Client): Promise<Client> {
        this.store.set(client.id, client.toSnapshot());
        return client;
    }
}
