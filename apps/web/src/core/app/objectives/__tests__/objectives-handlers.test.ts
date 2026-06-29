import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { Objective } from "@/core/domain/objectives/Objective";
import { ArchiveObjective } from "../ArchiveObjective";
import { CreateObjective } from "../CreateObjective";
import { GetObjective } from "../GetObjective";
import { ListObjectives } from "../ListObjectives";
import { MarkObjectiveAchieved } from "../MarkObjectiveAchieved";
import { ObjectivesModule } from "../ObjectivesModule";
import { UpdateObjective } from "../UpdateObjective";
import { FakeObjectivesGateway } from "./fakes/FakeObjectivesGateway";

function coreWith(gateway: FakeObjectivesGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new ObjectivesModule(gateway));
}

describe("objectives handlers (dispatched through the bus)", () => {
  it("routes list/get through the gateway and returns domain models", async () => {
    const gateway = new FakeObjectivesGateway();
    const core = coreWith(gateway);

    const objectives = await core.execute(new ListObjectives());
    const objective = await core.execute(new GetObjective("o1"));

    expect(gateway.callsTo("listObjectives")).toHaveLength(1);
    expect(gateway.callsTo("getObjective")[0].args).toEqual(["o1"]);
    expect(objectives[0]).toBeInstanceOf(Objective);
    expect(objective).toBeInstanceOf(Objective);
  });

  it("routes create/update/archive commands", async () => {
    const gateway = new FakeObjectivesGateway();
    const core = coreWith(gateway);

    await core.execute(new CreateObjective({
      title: "Leer 12 libros",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      metricSource: "manual",
      target: 12,
      unit: "libros",
      manualValue: 2,
    }));
    await core.execute(new UpdateObjective("o1", { manualValue: 5 }));
    const achieved = await core.execute(new MarkObjectiveAchieved("o1"));
    const archived = await core.execute(new ArchiveObjective("o1"));

    expect(gateway.callsTo("createObjective")[0].args[0]).toMatchObject({ title: "Leer 12 libros" });
    expect(gateway.callsTo("updateObjective")[0].args).toEqual(["o1", { manualValue: 5 }]);
    expect(gateway.callsTo("markObjectiveAchieved")[0].args).toEqual(["o1"]);
    expect(achieved.status).toBe("achieved");
    expect(gateway.callsTo("archiveObjective")[0].args).toEqual(["o1"]);
    expect(archived.status).toBe("archived");
  });
});
