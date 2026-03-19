import { FastifyInstance } from 'fastify';

export interface HttpController {
    register(app: FastifyInstance): void | Promise<void>;
}
