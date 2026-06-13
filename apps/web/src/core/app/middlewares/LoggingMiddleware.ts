import { ExecutionContext, Middleware, Request } from "@nbottarini/cqbus";

export interface LoggingSink {
  debug(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * Logs every request that flows through the CQBus with its duration, and
 * re-throws on failure after logging. Mirrors the backend's intent of a
 * uniform pipeline around use cases; kept silent unless a sink is provided.
 */
export class LoggingMiddleware implements Middleware {
  constructor(private readonly sink: LoggingSink) {}

  async exec<T extends Request<R>, R>(
    request: T,
    next: (request: T) => Promise<R>,
    _context: ExecutionContext,
  ): Promise<R> {
    const name = request.constructor.name;
    const startedAt = performance.now();
    try {
      const result = await next(request);
      this.sink.debug("request handled", {
        request: name,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return result;
    } catch (error) {
      this.sink.error("request failed", {
        request: name,
        durationMs: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/** Logs to the browser console in dev; no-op otherwise. */
export const consoleLoggingSink: LoggingSink = {
  debug: (message, data) => {
    if (import.meta.env.DEV) console.debug(`[cqbus] ${message}`, data ?? {});
  },
  error: (message, data) => {
    console.error(`[cqbus] ${message}`, data ?? {});
  },
};
