import { afterEach, describe, expect, it, vi } from "vitest";

import { GetHabitsOverview } from "@/core/app/health/GetHabitsOverview";
import { CreateGoal } from "@/core/app/health/CreateGoal";
import { ListTasks } from "@/core/app/tasks/ListTasks";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { GetMedicalRecords } from "@/core/app/health/medical/GetMedicalRecords";
import { ListProjects } from "@/core/app/projects/ListProjects";
import { ListObjectives } from "@/core/app/objectives/ListObjectives";
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

  it("registers the tasks handlers on the bus", async () => {
    stubFetchOk({ tasks: [], total: 0, limit: 50, offset: 0 });
    const core = createAppCore();

    const result = await core.execute(new ListTasks());

    expect(result).toEqual({ tasks: [], total: 0 });
  });

  it("registers the wallet handlers on the bus", async () => {
    stubFetchOk([]);
    const core = createAppCore();

    const result = await core.execute(new GetAccounts());

    expect(result).toEqual([]);
  });

  it("registers the projects handlers on the bus", async () => {
    stubFetchOk({ projects: [] });
    const core = createAppCore();

    const result = await core.execute(new ListProjects());

    expect(result).toEqual([]);
  });

  it("registers the objectives handlers on the bus", async () => {
    stubFetchOk({ objectives: [] });
    const core = createAppCore();

    const result = await core.execute(new ListObjectives());

    expect(result).toEqual([]);
  });

  it("registers the health medical handlers on the bus", async () => {
    stubFetchOk({ records: [] });
    const core = createAppCore();

    const result = await core.execute(new GetMedicalRecords());

    expect(result).toEqual([]);
  });

  it("wires session invalidation from API 401 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Not authenticated" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const onUnauthorized = vi.fn();
    const core = createAppCore({ onUnauthorized });

    await core.execute(new GetMedicalRecords()).catch(() => {});

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
