import { and, asc, eq } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { Client } from '../../domain/Client';
import { ClientRepository, type CreateClientData } from '../../domain/ClientRepository';
import { clients } from './schema';

export class DrizzleClientRepository extends ClientRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createClient(userId: string, data: CreateClientData): Promise<Client> {
        const [row] = await this.db.query
            .insert(clients)
            .values({
                ownerUserId: userId,
                name: data.name,
            })
            .returning();

        return this.toClient(row);
    }

    async getClient(userId: string, id: string): Promise<Client | null> {
        const [row] = await this.db.query
            .select()
            .from(clients)
            .where(and(eq(clients.id, id), eq(clients.ownerUserId, userId)))
            .limit(1);

        return row ? this.toClient(row) : null;
    }

    async listClients(userId: string): Promise<Client[]> {
        const rows = await this.db.query
            .select()
            .from(clients)
            .where(eq(clients.ownerUserId, userId))
            .orderBy(asc(clients.name));

        return rows.map((row) => this.toClient(row));
    }

    async save(userId: string, client: Client): Promise<Client> {
        const snapshot = client.toSnapshot();
        const [row] = await this.db.query
            .update(clients)
            .set({
                name: snapshot.name,
                status: snapshot.status,
                archivedAt: snapshot.archivedAt,
                updatedAt: snapshot.updatedAt,
            })
            .where(and(eq(clients.id, snapshot.id), eq(clients.ownerUserId, userId)))
            .returning();

        return this.toClient(row);
    }

    private toClient(row: typeof clients.$inferSelect): Client {
        return Client.fromSnapshot({
            id: row.id,
            name: row.name,
            status: row.status,
            archivedAt: row.archivedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
}
