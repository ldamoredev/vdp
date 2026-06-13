import type { CookieSerializeOptions } from '@fastify/cookie';

export const SESSION_COOKIE_NAME = 'vdp_session';

export function sessionCookieOptions(): CookieSerializeOptions {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
    };
}

export function sessionCookieClearOptions(): CookieSerializeOptions {
    return {
        ...sessionCookieOptions(),
        maxAge: undefined,
    };
}
