import type { DomainEvent, DomainName, EventHandler } from './DomainEvent';
import { Logger } from '../observability/logging/Logger';
import { NoOpLogger } from '../../infrastructure/observability/logging/NoOpLogger';

/**
 * In-process event bus for domain-to-domain communication.
 *
 * v1: Uses a simple Map + callbacks pattern.
 * v2: Can be upgraded to Redis pub/sub without changing the interface.
 *
 * Events are fire-and-forget by design. Handlers should not throw.
 * If a handler fails, the error is logged but doesn't affect other handlers.
 */
export class EventBus {
  constructor(private readonly logger: Logger = new NoOpLogger()) {}

  private handlers = new Map<string, EventHandler[]>();
  private globalHandlers: EventHandler[] = [];
  private eventLog: DomainEvent[] = [];
  private maxLogSize = 1000;

  /**
   * Subscribe to a specific event type.
   * Pattern: "domain.event_type" (e.g., "wallet.transaction.created")
   * Use "*" to subscribe to all events from a domain (e.g., "wallet.*")
   */
  on(pattern: string, handler: EventHandler): () => void {
    const handlers = this.handlers.get(pattern) || [];
    handlers.push(handler);
    this.handlers.set(pattern, handlers);

    // Return unsubscribe function
    return () => {
      const list = this.handlers.get(pattern);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx >= 0) list.splice(idx, 1);
      }
    };
  }

  /**
   * Subscribe to ALL events across all domains.
   * Useful for logging, timeline, and the orchestrator.
   */
  onAll(handler: EventHandler): () => void {
    this.globalHandlers.push(handler);
    return () => {
      const idx = this.globalHandlers.indexOf(handler);
      if (idx >= 0) this.globalHandlers.splice(idx, 1);
    };
  }

  /**
   * Emit a domain event. Handlers are called asynchronously.
   */
  async emit<T = Record<string, unknown>>(event: DomainEvent<T>): Promise<DomainEvent<T>> {

    // Store in event log (circular buffer)
    this.eventLog.push(event as DomainEvent);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Log to console for debugging
    this.logger.debug('event emitted', {
      event: `${event.domain}.${event.type}`,
      payload: JSON.stringify(event.payload).slice(0, 200),
    });

    // Fire handlers for exact match
    const exactKey = `${event.domain}.${event.type}`;
    await this.fireHandlers(exactKey, event as DomainEvent);

    // Fire handlers for wildcard match
    const wildcardKey = `${event.domain}.*`;
    await this.fireHandlers(wildcardKey, event as DomainEvent);

    // Fire global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(event as DomainEvent);
      } catch (err) {
        this.logger.error('event bus global handler error', {
          error: this.normalizeError(err),
          event: `${event.domain}.${event.type}`,
        });
      }
    }

    return event;
  }

  private async fireHandlers(key: string, event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(key);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err) {
        this.logger.error('event bus handler error', {
          error: this.normalizeError(err),
          pattern: key,
        });
      }
    }
  }

  private normalizeError(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }

    return typeof err === 'string' ? err : 'Unknown event bus error';
  }

  /**
   * Get recent events, optionally filtered by domain.
   */
  getRecentEvents(domain?: DomainName, limit = 50): DomainEvent[] {
    let events = this.eventLog;
    if (domain) {
      events = events.filter((e) => e.domain === domain);
    }
    return events.slice(-limit);
  }

  /**
   * Clear all handlers and event log. Useful for testing.
   */
  reset(): void {
    this.handlers.clear();
    this.globalHandlers = [];
    this.eventLog = [];
  }
}
