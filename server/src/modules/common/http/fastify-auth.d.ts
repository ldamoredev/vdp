import 'fastify';
import { AuthContext } from './AuthContext';

declare module 'fastify' {
    interface FastifyRequest {
        auth: AuthContext;
    }
}
