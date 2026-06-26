import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { TimeTrackingPresenter } from "../TimeTrackingPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(gateway: FakeProjectsGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new ProjectsModule(gateway));
}

describe("TimeTrackingPresenter", () => {
  it("stays empty and skips loading when no project is selected", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new TimeTrackingPresenter(vi.fn(), coreWith(gateway), null);
    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(gateway.callsTo("listTimeEntries")).toHaveLength(0);
    expect(presenter.model.entries).toEqual([]);
    expect(presenter.model.isLoading).toBe(false);
  });

  it("loads entries for the project and totals their minutes", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new TimeTrackingPresenter(vi.fn(), coreWith(gateway), "p1");
    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(gateway.callsTo("listTimeEntries")[0].args).toEqual([{ projectId: "p1" }]);
    expect(presenter.model.entries).toHaveLength(1);
    expect(presenter.model.totalLabel).toBe("1h 30m"); // seed entry is 90 minutes
  });

  it("converts hours to minutes when logging an entry", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new TimeTrackingPresenter(vi.fn(), coreWith(gateway), "p1");
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.setDate("2026-06-20");
    presenter.setHours("1.5");
    presenter.setNote("Pairing");
    await presenter.logEntry();

    expect(gateway.callsTo("logTimeEntry")[0].args[0]).toEqual({
      projectId: "p1",
      date: "2026-06-20",
      minutes: 90,
      note: "Pairing",
    });
    expect(presenter.model.form.hours).toBe("");
  });

  it("rejects non-positive hours", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new TimeTrackingPresenter(vi.fn(), coreWith(gateway), "p1");
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.setHours("0");
    expect(presenter.model.form.canSubmit).toBe(false);
    await presenter.logEntry();
    expect(gateway.callsTo("logTimeEntry")).toHaveLength(0);
  });

  it("deletes an entry through the gateway", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new TimeTrackingPresenter(vi.fn(), coreWith(gateway), "p1");
    presenter.init(undefined);
    presenter.start();
    await flush();

    await presenter.deleteEntry("te1");
    expect(gateway.callsTo("deleteTimeEntry")[0].args).toEqual(["te1"]);
  });
});
