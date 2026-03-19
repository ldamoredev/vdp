import { randomUUID } from 'crypto';

export type DomainName = 'wallet' | 'health' | 'tasks' | 'people' | 'work' | 'study' | 'system';

export abstract class DomainEvent<T = Record<string, unknown>> {
    public id: string;
    public domain: DomainName;
    public type: string;
    public payload: T;
    public timestamp: Date;
    public metadata?: {
        triggeredBy?: string;
        correlationId?: string;
    };

    protected constructor(
        domain: DomainName,
        type: string,
        payload: any,
        metadata?: { triggeredBy?: string; correlationId?: string; })
    {
        this.id = randomUUID();
        this.domain = domain;
        this.type = type;
        this.payload = payload;
        this.timestamp = new Date();
        this.metadata = metadata;
    }
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;
