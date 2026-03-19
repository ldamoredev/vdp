import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export type HttpErrorCode =
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'DOMAIN_ERROR'
    | 'SERVICE_UNAVAILABLE'
    | 'INTERNAL_ERROR';

export type HttpErrorResponse = {
    error: HttpErrorCode;
    message: string;
    details?: unknown;
};

export class HttpError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: HttpErrorCode,
        message: string,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

export class ValidationHttpError extends HttpError {
    constructor(message: string, details?: unknown) {
        super(400, 'VALIDATION_ERROR', message, details);
    }
}

export class NotFoundHttpError extends HttpError {
    constructor(message: string, details?: unknown) {
        super(404, 'NOT_FOUND', message, details);
    }
}

export class ConflictHttpError extends HttpError {
    constructor(message: string, details?: unknown) {
        super(409, 'CONFLICT', message, details);
    }
}

export class DomainHttpError extends HttpError {
    constructor(message: string, details?: unknown) {
        super(422, 'DOMAIN_ERROR', message, details);
    }
}

export class ServiceUnavailableHttpError extends HttpError {
    constructor(message: string, details?: unknown) {
        super(503, 'SERVICE_UNAVAILABLE', message, details);
    }
}

export function isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError;
}

export function assertFound<T>(value: T | null | undefined, message: string): T {
    if (value == null) throw new NotFoundHttpError(message);
    return value;
}

export function httpErrorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
    if (isHttpError(error)) {
        return reply.status(error.statusCode).send({
            error: error.code,
            message: error.message,
            ...(error.details !== undefined ? { details: error.details } : {}),
        } satisfies HttpErrorResponse);
    }

    request.log.error(error);
    return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Unexpected server error',
    } satisfies HttpErrorResponse);
}
