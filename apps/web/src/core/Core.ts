import { CQBus, ExecutionContext, Request, RequestResult } from "@nbottarini/cqbus";
import { HttpClient } from "@nbottarini/abstract-http-client";

import { consoleLoggingSink, LoggingMiddleware, LoggingSink } from "./app/middlewares/LoggingMiddleware";
import { FetchHttpClient } from "./infrastructure/http/FetchHttpClient";

/**
 * A feature module plugs its command/query handlers into the bus. It builds
 * its gateways from `core.httpClient` and registers handlers on `core.bus` —
 * the frontend analogue of the backend's module runtimes.
 */
export interface CoreModule {
  register(core: Core): void;
}

export interface CoreOptions {
  httpClient?: HttpClient;
  loggingSink?: LoggingSink;
  onUnauthorized?: () => void;
}

/**
 * Frontend composition root. Owns the CQBus and the HTTP client, wires the
 * base middleware pipeline, and lets feature modules register their handlers.
 * No React here — the bridge lives in src/CoreProvider.tsx.
 */
export class Core {
  readonly bus: CQBus;
  readonly httpClient: HttpClient;

  constructor(options: CoreOptions = {}) {
    this.bus = new CQBus();
    this.httpClient = options.httpClient ?? new FetchHttpClient({
      baseUrl: "/api/v1",
      onUnauthorized: options.onUnauthorized,
    });
    this.bus.registerMiddleware(new LoggingMiddleware(options.loggingSink ?? consoleLoggingSink));
  }

  /** Register a feature module's handlers. Returns this for chaining. */
  use(module: CoreModule): this {
    module.register(this);
    return this;
  }

  /** Dispatch a command or query through the bus. Presenters call this. */
  execute<T extends Request<any>>(request: T, context?: ExecutionContext): Promise<RequestResult<T>> {
    return this.bus.execute(request, context);
  }
}
