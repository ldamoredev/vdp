export type DomainName = "wallet" | "health" | "tasks" | "people" | "work" | "study" | "system";

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  domain: DomainName;
  type: string;
  payload: T;
  timestamp: Date;
  metadata?: {
    triggeredBy?: string;
    correlationId?: string;
  };
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;
