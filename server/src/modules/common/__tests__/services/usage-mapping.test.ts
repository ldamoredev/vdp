import { describe, expect, it } from 'vitest';

import { mapRequestToUsage } from '../../infrastructure/usage/usage-mapping';

describe('mapRequestToUsage', () => {
    it('maps a domain API route to its surface and a method-qualified action', () => {
        expect(mapRequestToUsage('GET', '/api/v1/tasks')).toEqual({
            surface: 'tasks',
            action: 'GET /tasks',
        });
    });

    it('keeps route params in the action so distinct operations stay distinct', () => {
        expect(mapRequestToUsage('POST', '/api/v1/tasks/:id/complete')).toEqual({
            surface: 'tasks',
            action: 'POST /tasks/:id/complete',
        });
    });

    it('lowercases nothing and uppercases the method', () => {
        expect(mapRequestToUsage('post', '/api/v1/wallet/transactions')).toEqual({
            surface: 'wallet',
            action: 'POST /wallet/transactions',
        });
    });

    it('ignores auth plumbing routes', () => {
        expect(mapRequestToUsage('POST', '/api/auth/login')).toBeNull();
        expect(mapRequestToUsage('GET', '/api/auth/me')).toBeNull();
    });

    it('ignores the health check and non-API paths', () => {
        expect(mapRequestToUsage('GET', '/api/health')).toBeNull();
        expect(mapRequestToUsage('GET', '/assets/index.js')).toBeNull();
        expect(mapRequestToUsage('GET', '/tasks')).toBeNull();
    });

    it('ignores preflight and HEAD requests', () => {
        expect(mapRequestToUsage('OPTIONS', '/api/v1/tasks')).toBeNull();
        expect(mapRequestToUsage('HEAD', '/api/v1/tasks')).toBeNull();
    });

    it('ignores unmatched routes (no route pattern)', () => {
        expect(mapRequestToUsage('GET', undefined)).toBeNull();
    });
});
