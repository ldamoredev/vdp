import type { RecurringTransaction as RecurringDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { RecurringPresenter } from "../RecurringPresenter";

function rule(overrides: Partial<RecurringDto> = {}): RecurringDto {
  return {
    id: "r1",
    accountId: "a1",
    categoryId: "c1",
    type: "expense",
    amount: "50000",
    currency: "ARS",
    description: "Alquiler",
    dayOfMonth: 1,
    startDate: "2026-04-01",
    endDate: null,
    lastRunDate: null,
    active: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

function build(rules: RecurringDto[] = []) {
  const gateway = new FakeWalletGateway();
  vi.spyOn(gateway, "getRecurringTransactions").mockResolvedValue(rules);
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new WalletModule(gateway),
  );
  const presenter = new RecurringPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("RecurringPresenter", () => {
  it("lists rules with schedule and tone", async () => {
    const { presenter } = build([rule({ description: "Alquiler", amount: "50000" })]);

    presenter.start();
    await flush();

    expect(presenter.model.isEmpty).toBe(false);
    const [row] = presenter.model.rules;
    expect(row.title).toBe("Alquiler");
    expect(row.scheduleLabel).toBe("día 1 de cada mes");
    expect(row.toneIsExpense).toBe(true);
    expect(row.amountLabel).toContain("50.000");
  });

  it("gates submit until account, amount and day are valid", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    presenter.toggleForm();
    expect(presenter.model.form?.canSubmit).toBe(false);

    presenter.setFormField("accountId", "a1");
    presenter.setFormField("amount", "50000");
    presenter.setFormField("dayOfMonth", "10");
    expect(presenter.model.form?.canSubmit).toBe(true);
  });

  it("creates a rule with the account's currency and reloads", async () => {
    const { presenter, gateway } = build();
    const create = vi.spyOn(gateway, "createRecurringTransaction");
    presenter.start();
    await flush();

    presenter.toggleForm();
    presenter.setFormField("accountId", "a1"); // FakeWalletGateway account is ARS
    presenter.setFormField("amount", "50000");
    presenter.setFormField("description", "Alquiler");
    presenter.setFormField("dayOfMonth", "1");
    presenter.setFormField("startDate", "2026-04-01");
    await presenter.submit();

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "a1",
        currency: "ARS",
        amount: "50000",
        dayOfMonth: 1,
        startDate: "2026-04-01",
        description: "Alquiler",
        type: "expense",
      }),
    );
    expect(presenter.model.form).toBeNull();
  });

  it("deletes a rule", async () => {
    const { presenter, gateway } = build([rule({ id: "r9" })]);
    const remove = vi.spyOn(gateway, "deleteRecurringTransaction");
    presenter.start();
    await flush();

    await presenter.deleteRule("r9");

    expect(remove).toHaveBeenCalledWith("r9");
  });
});
