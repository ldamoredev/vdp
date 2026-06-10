import { ZodType, ZodTypeDef } from 'zod';
import { ValidationHttpError } from './errors';

export function parseBody<T>(schema: ZodType<T, ZodTypeDef, unknown>, body: unknown): T {
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationHttpError('Invalid request body', result.error.flatten());
    }
    return result.data;
}

export function parseQuery<T>(schema: ZodType<T, ZodTypeDef, unknown>, query: unknown): T {
    const result = schema.safeParse(query);
    if (!result.success) {
        throw new ValidationHttpError('Invalid request query', result.error.flatten());
    }
    return result.data;
}

export function parseParams<T>(schema: ZodType<T, ZodTypeDef, unknown>, params: unknown): T {
    const result = schema.safeParse(params);
    if (!result.success) {
        throw new ValidationHttpError('Invalid request params', result.error.flatten());
    }
    return result.data;
}
