import type { SavingsGoal as SavingsGoalDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { SavingsGoal } from "@/core/domain/wallet/SavingsGoal";
import { SavingsPresenter } from "../SavingsPresenter";

function goalDto(overrides: Partial<SavingsGoalDto> = {}): SavingsGoalDto {
  return {
    id: "s1",
    name: "Viaje",
    targetAmount: "1000",
    currentAmount: "250",
    currency: "ARS",
    deadline: null,
    isCompleted: false,
    createdAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function build(goals: SavingsGoalDto[] = [goalDto()]) {
  const gateway = new FakeWalletGateway();
  const getSavings = vi.spyOn(gateway, "getSavings").mockResolvedValue(goals.map(SavingsGoal.from));
  const createSavingsGoal = vi.spyOn(gateway, "createSavingsGoal");
  const contributeSavings = vi.spyOn(gateway, "contributeSavings");
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
  const presenter = new SavingsPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway, getSavings, createSavingsGoal, contributeSavings };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("SavingsPresenter", () => {
  it("loads goals and maps progress from the domain model", async () => {
    const { presenter } = build([goalDto({ currentAmount: "250", targetAmount: "1000", deadline: null })]);

    presenter.start();
    await flush();

    const goal = presenter.model.goals[0];
    expect(goal.progressPercent).toBe(25);
    expect(goal.progressLabel).toBe("25%");
    expect(goal.deadlineLabel).toBe("Sin fecha limite");
    expect(goal.currentLabel).toContain("250");
    expect(goal.targetLabel).toContain("1.000");
  });

  it("shows the empty state when there are no goals", async () => {
    const { presenter } = build([]);

    presenter.start();
    await flush();

    expect(presenter.model.emptyState?.title).toBe("Todavía no hay objetivos");
    expect(presenter.model.goals).toHaveLength(0);
  });

  it("requires a name and target before creating a goal", async () => {
    const { presenter, createSavingsGoal } = build();
    presenter.start();
    await flush();
    presenter.toggleForm();

    presenter.setFormField("name", "Auto");
    expect(presenter.model.form?.canSubmit).toBe(false);
    presenter.setFormField("targetAmount", "5000");
    expect(presenter.model.form?.canSubmit).toBe(true);

    await presenter.submit();

    expect(createSavingsGoal).toHaveBeenCalledWith({
      name: "Auto",
      targetAmount: "5000",
      currency: "ARS",
      deadline: null,
    });
    expect(presenter.model.form).toBeNull();
  });

  it("opens the contribution form for one goal and submits with today's date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00.000-03:00"));
    try {
      const { presenter, contributeSavings } = build();
      presenter.start();
      await flush();

      presenter.startContribution("s1");
      expect(presenter.model.goals[0].isContributing).toBe(true);
      expect(presenter.model.goals[0].canSubmitContribution).toBe(false);

      presenter.setContributeAmount("100");
      expect(presenter.model.goals[0].canSubmitContribution).toBe(true);

      await presenter.submitContribution();

      expect(contributeSavings).toHaveBeenCalledWith("s1", { amount: "100", date: "2026-06-14" });
      expect(presenter.model.goals[0].isContributing).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not submit a contribution without an amount", async () => {
    const { presenter, contributeSavings } = build();
    presenter.start();
    await flush();
    presenter.startContribution("s1");

    await presenter.submitContribution();

    expect(contributeSavings).not.toHaveBeenCalled();
  });
});
