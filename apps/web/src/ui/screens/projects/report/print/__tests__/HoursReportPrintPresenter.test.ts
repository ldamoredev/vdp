import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { HoursReportPrintPresenter } from "../HoursReportPrintPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(gateway: FakeProjectsGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new ProjectsModule(gateway));
}

describe("HoursReportPrintPresenter", () => {
  it("loads the report for the given period and builds a printable model", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new HoursReportPrintPresenter(vi.fn(), coreWith(gateway), "2026-06-01", "2026-06-30");

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(gateway.callsTo("getHoursReport")[0].args[0]).toEqual({
      fromDate: "2026-06-01",
      toDate: "2026-06-30",
    });
    expect(presenter.model.hasRows).toBe(true);
    expect(presenter.model.totalLabel).toBe("1h 30m");
    expect(presenter.model.periodLabel).toContain("2026");
    expect(presenter.model.generatedAtLabel).not.toBe("");
    expect(presenter.model.rows[0]).toMatchObject({
      projectOutcome: "Ship D3a",
      clientName: "Acme",
      durationLabel: "1h 30m",
    });
    expect(presenter.model.rows[0].expectedIncomeLabel).not.toBeNull();
    expect(presenter.model.incomeTotals[0]).toMatchObject({ currency: "USD" });
  });

  it("flags an invalid date range without querying the gateway", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new HoursReportPrintPresenter(vi.fn(), coreWith(gateway), "2026-06-30", "2026-06-01");

    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(gateway.callsTo("getHoursReport")).toHaveLength(0);
    expect(presenter.model.error).not.toBeNull();
    expect(presenter.model.hasRows).toBe(false);
  });
});
