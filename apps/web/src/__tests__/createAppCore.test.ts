import { afterEach, describe, expect, it, vi } from "vitest";

import { GetHabitsOverview } from "@/core/app/health/GetHabitsOverview";
import { CreateGoal } from "@/core/app/health/CreateGoal";
import { createAppCore } from "@/createAppCore";

/**
 * Guards the real composition root: a Core with no module registered throws
 * RequestHandlerNotRegisteredError for every request. This is the wiring the
 * hand-built Cores in unit tests cannot catch.
 */
describe("createAppCore", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetchOk(body: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  }

  it("registers the health query handlers on the bus", async () => {
    stubFetchOk({ habits: [], date: "2026-06-13" });
    const core = createAppCore();

    const result = await core.execute(new GetHabitsOverview());

    expect(result).toEqual({ habits: [], date: "2026-06-13" });
  });

  it("registers the health command handlers on the bus", async () => {
    stubFetchOk({});
    const core = createAppCore();

    await expect(
      core.execute(new CreateGoal({ title: "Gym", targetDate: "2026-07-01" })),
    ).resolves.toBeUndefined();
  });
});
