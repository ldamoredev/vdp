import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { HoursReportPresenter } from "../HoursReportPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(gateway: FakeProjectsGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new ProjectsModule(gateway));
}

describe("HoursReportPresenter", () => {
  it("loads the report for the default range and maps rows", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new HoursReportPresenter(vi.fn(), coreWith(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(gateway.callsTo("getHoursReport")).toHaveLength(1);
    expect(presenter.model.totalLabel).toBe("1h 30m");
    expect(presenter.model.rows[0]).toMatchObject({
      projectOutcome: "Ship D3a",
      clientName: "Acme",
      durationLabel: "1h 30m",
      expectedIncomeLabel: "US$ 150,00",
      registerIncomeHref:
        "/wallet/transactions/new?type=income&amount=150.00&currency=USD&description=Ship+D3a",
    });
    expect(presenter.model.incomeTotals).toEqual([{ currency: "USD", amountLabel: "US$ 150,00" }]);
  });

  it("reloads with updated date filters", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new HoursReportPresenter(vi.fn(), coreWith(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.setFromDate("2026-06-01");
    presenter.setToDate("2026-06-30");
    await presenter.reload();

    const last = gateway.callsTo("getHoursReport").at(-1);
    expect(last?.args[0]).toEqual({ fromDate: "2026-06-01", toDate: "2026-06-30" });
  });

  it("flags an invalid range without calling the gateway", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new HoursReportPresenter(vi.fn(), coreWith(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    const callsBefore = gateway.callsTo("getHoursReport").length;
    presenter.setFromDate("2026-06-30");
    presenter.setToDate("2026-06-01");
    await presenter.reload();

    expect(gateway.callsTo("getHoursReport")).toHaveLength(callsBefore);
    expect(presenter.model.error).toMatch(/rango/i);
  });
});
