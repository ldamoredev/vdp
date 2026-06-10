import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodType, ZodTypeDef } from 'zod';

import { parseBody, parseParams, parseQuery } from './validation';

export function defineRoute<TParams = undefined, TQuery = undefined, TBody = undefined>(
    schemas: RouteSchemas<TParams, TQuery, TBody>,
    handler: (context: RouteContext<TParams, TQuery, TBody>) => Promise<unknown> | unknown,
) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        return handler({
            request,
            reply,
            params: schemas.params ? parseParams(schemas.params, request.params) : undefined,
            query: schemas.query ? parseQuery(schemas.query, request.query) : undefined,
            body: schemas.body ? parseBody(schemas.body, request.body) : undefined,
        });
    };
}

type Maybe<T> = T | undefined;

// Input is `unknown` so schemas whose input differs from their output
// (e.g. `.default()`, coercions) are accepted; parsing takes unknown anyway.
export type RouteSchemas<TParams, TQuery, TBody> = {
    params?: ZodType<TParams, ZodTypeDef, unknown>;
    query?: ZodType<TQuery, ZodTypeDef, unknown>;
    body?: ZodType<TBody, ZodTypeDef, unknown>;
};

export type RouteContextHandler<TParams, TQuery, TBody> = (
    context: RouteContext<TParams, TQuery, TBody>,
) => Promise<unknown> | unknown;

export type RouteContext<TParams, TQuery, TBody> = {
    request: FastifyRequest;
    reply: FastifyReply;
    params: Maybe<TParams>;
    query: Maybe<TQuery>;
    body: Maybe<TBody>;
};
