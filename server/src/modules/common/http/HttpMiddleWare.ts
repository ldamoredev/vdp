import { FastifyInstance } from 'fastify';

export abstract class HttpMiddleWare {
    public abstract plugin(fastify: FastifyInstance): Promise<void>
}