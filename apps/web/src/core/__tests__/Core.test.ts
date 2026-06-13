import { Query, RequestHandler } from "@nbottarini/cqbus";
import { describe, expect, it, vi } from "vitest";

import { Core, CoreModule } from "../Core";
import { LoggingSink } from "../app/middlewares/LoggingMiddleware";

class Ping extends Query<string> {
  constructor(readonly value: string) {
    super();
  }
}

class PingHandler implements RequestHandler<Ping, string> {
  async handle(request: Ping): Promise<string> {
    return `pong:${request.value}`;
  }
}

class Boom extends Query<never> {}

class BoomHandler implements RequestHandler<Boom, never> {
  async handle(): Promise<never> {
    throw new Error("kaboom");
  }
}

function silentSink(): LoggingSink {
  return { debug: vi.fn(), error: vi.fn() };
}

describe("Core", () => {
  it("dispatches a query to its registered handler through the bus", async () => {
    const core = new Core({ httpClient: {} as never, loggingSink: silentSink() });
    core.bus.registerHandler(Ping, () => new PingHandler());

    const result = await core.execute(new Ping("hi"));

    expect(result).toBe("pong:hi");
  });

  it("registers a module's handlers via use()", async () => {
    const module: CoreModule = {
      register: (core) => core.bus.registerHandler(Ping, () => new PingHandler()),
    };
    const core = new Core({ httpClient: {} as never, loggingSink: silentSink() }).use(module);

    expect(await core.execute(new Ping("mod"))).toBe("pong:mod");
  });

  it("runs the logging middleware around a successful request", async () => {
    const sink = silentSink();
    const core = new Core({ httpClient: {} as never, loggingSink: sink });
    core.bus.registerHandler(Ping, () => new PingHandler());

    await core.execute(new Ping("x"));

    expect(sink.debug).toHaveBeenCalledWith(
      "request handled",
      expect.objectContaining({ request: "Ping" }),
    );
  });

  it("logs and re-throws when a handler fails", async () => {
    const sink = silentSink();
    const core = new Core({ httpClient: {} as never, loggingSink: sink });
    core.bus.registerHandler(Boom, () => new BoomHandler());

    await expect(core.execute(new Boom())).rejects.toThrow("kaboom");
    expect(sink.error).toHaveBeenCalledWith(
      "request failed",
      expect.objectContaining({ request: "Boom", error: "kaboom" }),
    );
  });
});
