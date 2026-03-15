import { randomUUID } from "crypto";
import type { DomainEvent, DomainName, EventHandler } from "./types.js";

/**
 * In-process event bus for domain-to-domain communication.
 *
 * v1: Uses a simple Map + callbacks pattern.
 * v2: Can be upgraded to Redis pub/sub without changing the interface.
 *
 * Events are fire-and-forget by design. Handlers should not throw.
 * If a handler fails, the error is logged but doesn't affect other handlers.
 */
class EventBusImpl {
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
  async emit<T = Record<string, unknown>>(
    domain: DomainName,
    type: string,
    payload: T,
    metadata?: DomainEvent["metadata"]
  ): Promise<DomainEvent<T>> {
    const event: DomainEvent<T> = {
      id: randomUUID(),
      domain,
      type,
      payload,
      timestamp: new Date(),
      metadata,
    };

    // Store in event log (circular buffer)
    this.eventLog.push(event as DomainEvent);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Log to console for debugging
    console.log(`[EVENT] ${domain}.${type}`, JSON.stringify(payload).slice(0, 200));

    // Fire handlers for exact match
    const exactKey = `${domain}.${type}`;
    await this.fireHandlers(exactKey, event as DomainEvent);

    // Fire handlers for wildcard match
    const wildcardKey = `${domain}.*`;
    await this.fireHandlers(wildcardKey, event as DomainEvent);

    // Fire global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(event as DomainEvent);
      } catch (err) {
        console.error(`[EVENT BUS] Global handler error:`, err);
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
        console.error(`[EVENT BUS] Handler error for "${key}":`, err);
      }
    }
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

// Singleton instance
export const eventBus = new EventBusImpl();
export type EventBus = EventBusImpl;
