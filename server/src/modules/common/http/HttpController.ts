import {
    FastifyInstance,
    FastifyPluginAsync,
    HTTPMethods,
    onRequestHookHandler,
    RouteHandlerMethod,
} from 'fastify';
import { defineRoute, RouteContextHandler, RouteSchemas } from './routes';

export interface Controller {
    readonly prefix: string;
    registerRoutes(routes: RouteRegister): void | Promise<void>;
}

export abstract class HttpController implements Controller {
    abstract readonly prefix: string;

    register(app: FastifyInstance): void {
        const plugin: FastifyPluginAsync = async (scopedApp) => {
            await this.registerRoutes(new RouteRegister(scopedApp));
        };

        app.register(plugin, { prefix: this.prefix });
    }

    abstract registerRoutes(routes: RouteRegister): void | Promise<void>;
}

export class RouteRegister {
    constructor(private readonly app: FastifyInstance) {}

    before(handler: onRequestHookHandler): RouteRegister {
        this.app.addHook('onRequest', handler);
        return this;
    }

    get(path: string, handler: RouteHandlerMethod): RouteRegister;
    get<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemas: RouteSchemas<TParams, TQuery, TBody>,
        handler: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister;
    get<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemasOrHandler: RouteSchemas<TParams, TQuery, TBody> | RouteHandlerMethod,
        maybeHandler?: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister {
        return this.registerRoute('GET', path, this.resolveHandler(schemasOrHandler, maybeHandler));
    }

    post(path: string, handler: RouteHandlerMethod): RouteRegister;
    post<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemas: RouteSchemas<TParams, TQuery, TBody>,
        handler: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister;
    post<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemasOrHandler: RouteSchemas<TParams, TQuery, TBody> | RouteHandlerMethod,
        maybeHandler?: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister {
        return this.registerRoute('POST', path, this.resolveHandler(schemasOrHandler, maybeHandler));
    }

    put(path: string, handler: RouteHandlerMethod): RouteRegister;
    put<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemas: RouteSchemas<TParams, TQuery, TBody>,
        handler: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister;
    put<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemasOrHandler: RouteSchemas<TParams, TQuery, TBody> | RouteHandlerMethod,
        maybeHandler?: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister {
        return this.registerRoute('PUT', path, this.resolveHandler(schemasOrHandler, maybeHandler));
    }

    patch(path: string, handler: RouteHandlerMethod): RouteRegister;
    patch<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemas: RouteSchemas<TParams, TQuery, TBody>,
        handler: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister;
    patch<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemasOrHandler: RouteSchemas<TParams, TQuery, TBody> | RouteHandlerMethod,
        maybeHandler?: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister {
        return this.registerRoute('PATCH', path, this.resolveHandler(schemasOrHandler, maybeHandler));
    }

    delete(path: string, handler: RouteHandlerMethod): RouteRegister;
    delete<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemas: RouteSchemas<TParams, TQuery, TBody>,
        handler: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister;
    delete<TParams = undefined, TQuery = undefined, TBody = undefined>(
        path: string,
        schemasOrHandler: RouteSchemas<TParams, TQuery, TBody> | RouteHandlerMethod,
        maybeHandler?: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteRegister {
        return this.registerRoute('DELETE', path, this.resolveHandler(schemasOrHandler, maybeHandler));
    }

    private registerRoute(
        method: HTTPMethods,
        path: string,
        handler: RouteHandlerMethod,
    ): RouteRegister {
        this.app.route({ method, url: path, handler });
        return this;
    }

    private resolveHandler<TParams = undefined, TQuery = undefined, TBody = undefined>(
        schemasOrHandler: RouteSchemas<TParams, TQuery, TBody> | RouteHandlerMethod,
        maybeHandler?: RouteContextHandler<TParams, TQuery, TBody>,
    ): RouteHandlerMethod {
        if (!maybeHandler) {
            return schemasOrHandler as RouteHandlerMethod;
        }

        return defineRoute(
            schemasOrHandler as RouteSchemas<TParams, TQuery, TBody>,
            maybeHandler,
        );
    }
}
