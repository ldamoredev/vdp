import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodType } from 'zod';

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

export type RouteSchemas<TParams, TQuery, TBody> = {
    params?: ZodType<TParams>;
    query?: ZodType<TQuery>;
    body?: ZodType<TBody>;
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
