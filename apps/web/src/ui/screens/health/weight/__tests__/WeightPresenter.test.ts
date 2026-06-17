import type { WeightTrendResponse } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { HealthModule } from "@/core/app/health/HealthModule";
import { FakeHealthGateway } from "@/core/app/health/__tests__/fakes/FakeHealthGateway";
import { WeightPresenter } from "../WeightPresenter";

function trend(overrides: Partial<WeightTrendResponse> = {}): WeightTrendResponse {
  return {
    entries: [
      { id: "w1", date: "2026-06-10", weightKg: "83.40", createdAt: "", updatedAt: "" },
      { id: "w2", date: "2026-06-14", weightKg: "82.10", createdAt: "", updatedAt: "" },
    ],
    date: "2026-06-14",
    summary: {
      days: 30,
      entryCount: 2,
      currentWeightKg: "82.10",
      previousWeightKg: "83.40",
      changeKg: "-1.30",
      direction: "down",
    },
    ...overrides,
  };
}

function build(response: WeightTrendResponse = trend()) {
  const gateway = new FakeHealthGateway();
  const getWeightTrend = vi.spyOn(gateway, "getWeightTrend").mockResolvedValue(response);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new HealthModule(gateway),
  );
  const presenter = new WeightPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway, getWeightTrend };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("WeightPresenter", () => {
  it("loads the latest weight and builds a sparkline", async () => {
    const { presenter } = build();

    presenter.start();
    await flush();

    expect(presenter.model.currentWeightLabel).toBe("82.1 kg");
    expect(presenter.model.changeLabel).toBe("bajó 1.3 kg");
    expect(presenter.model.sparkline?.points).toContain(",");
  });

  it("saves a new weight entry and reloads the trend", async () => {
    const { presenter, gateway, getWeightTrend } = build();
    presenter.start();
    await flush();

    presenter.setNewWeight("81.90");
    presenter.setNewDate("2026-06-15");
    await presenter.save();

    expect(gateway.callsTo("saveWeightEntry")[0].args).toEqual([{ weightKg: "81.90", date: "2026-06-15" }]);
    expect(getWeightTrend).toHaveBeenCalledTimes(2);
  });

  it("gates saving on a weight value", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    expect(presenter.model.canSave).toBe(false);
    presenter.setNewWeight("82");
    expect(presenter.model.canSave).toBe(true);
  });
});
