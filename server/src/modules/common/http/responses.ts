import { FastifyReply } from 'fastify';
import type { PaginatedCollection, PaginationMeta } from '@vdp/shared';

// The pagination envelope is part of the shared API contract: the web client
// types list responses with the same PaginatedCollection from @vdp/shared.
export type { PaginationMeta };

export type PaginatedCollectionResponse<TKey extends string, TItem> = PaginatedCollection<TKey, TItem>;

export type MessageResponse = {
    message: string;
};

export type CarryOverResponse<T> = {
    carriedOver: number;
    tasks: T[];
};

export type StatusResponse = {
    status: 'ok';
    timestamp: string;
    domains: string[];
    agents: string[];
    skills: string[];
};

export function sendCreated<T>(reply: FastifyReply, payload: T) {
    return reply.status(201).send(payload);
}

export function sendMessage(reply: FastifyReply, message: string) {
    return reply.send({
        message,
    } satisfies MessageResponse);
}

export function paginatedCollection<TKey extends string, TItem>(
    key: TKey,
    items: TItem[],
    meta: PaginationMeta,
): PaginatedCollectionResponse<TKey, TItem> {
    return {
        [key]: items,
        total: meta.total,
        limit: meta.limit,
        offset: meta.offset,
    } as PaginatedCollectionResponse<TKey, TItem>;
}

export function carryOverResponse<T>(tasks: T[]): CarryOverResponse<T> {
    return {
        carriedOver: tasks.length,
        tasks,
    };
}

export function buildStatusResponse(data: {
    domains: string[];
    agents: string[];
    skills: string[];
}): StatusResponse {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        domains: data.domains,
        agents: data.agents,
        skills: data.skills,
    };
}
