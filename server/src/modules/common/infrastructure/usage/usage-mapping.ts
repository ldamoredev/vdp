export type UsageKey = { surface: string; action: string };

const API_PREFIX = '/api/v1/';
const IGNORED_METHODS = new Set(['OPTIONS', 'HEAD']);

/**
 * Derives the usage-event key from a matched Fastify route. Returns null for
 * everything that is not product usage: auth plumbing, the health check, SPA
 * assets, preflights, and unmatched requests. `routePattern` is the route's
 * registered pattern (`request.routeOptions.url`), so params stay symbolic
 * (`/tasks/:id/complete`) and cardinality stays bounded.
 */
export function mapRequestToUsage(method: string, routePattern: string | undefined): UsageKey | null {
    if (!routePattern || !routePattern.startsWith(API_PREFIX)) return null;

    const normalizedMethod = method.toUpperCase();
    if (IGNORED_METHODS.has(normalizedMethod)) return null;

    const path = routePattern.slice(API_PREFIX.length - 1); // keep the leading slash
    const surface = path.split('/')[1];
    if (!surface) return null;

    return { surface, action: `${normalizedMethod} ${path}` };
}
