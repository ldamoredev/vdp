import type { Account, Investment as InvestmentDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { Investment } from "@/core/domain/wallet/Investment";
import { InvestmentsPresenter } from "../InvestmentsPresenter";

function investmentDto(overrides: Partial<InvestmentDto> = {}): InvestmentDto {
  return {
    id: "i1",
    name: "Plazo",
    type: "plazo_fijo",
    accountId: null,
    currency: "ARS",
    investedAmount: "1000",
    currentValue: "1100",
    startDate: "2026-01-01",
    endDate: null,
    rate: null,
    notes: null,
    isActive: true,
    ...overrides,
  };
}

function accountDto(overrides: Partial<Account> = {}): Account {
  return {
    id: "a1",
    name: "Brubank",
    currency: "ARS",
    type: "bank",
    initialBalance: "0",
    isActive: true,
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function build(investments: InvestmentDto[] = [investmentDto()], accounts: Account[] = [accountDto()]) {
  const gateway = new FakeWalletGateway();
  const getInvestments = vi
    .spyOn(gateway, "getInvestments")
    .mockResolvedValue(investments.map(Investment.from));
  const getAccounts = vi.spyOn(gateway, "getAccounts").mockResolvedValue(accounts);
  const createInvestment = vi.spyOn(gateway, "createInvestment");
  const updateInvestment = vi.spyOn(gateway, "updateInvestment");
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
  const presenter = new InvestmentsPresenter(vi.fn(), core, "2026-06-14");
  presenter.init(undefined);
  return { presenter, gateway, getInvestments, getAccounts, createInvestment, updateInvestment };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("InvestmentsPresenter", () => {
  it("rolls the summary up per currency, never merging ARS and USD", async () => {
    const { presenter } = build([
      investmentDto({ id: "ars", currency: "ARS", investedAmount: "1000", currentValue: "1200" }),
      investmentDto({ id: "usd", currency: "USD", investedAmount: "100", currentValue: "90" }),
    ]);

    presenter.start();
    await flush();

    expect(presenter.model.summaries).toHaveLength(2);
    const ars = presenter.model.summaries.find((s) => s.currency === "ARS")!;
    expect(ars.totalReturnLabel).toBe("20.0%");
    expect(ars.positive).toBe(true);
    const usd = presenter.model.summaries.find((s) => s.currency === "USD")!;
    expect(usd.totalReturnLabel).toBe("-10.0%");
    expect(usd.positive).toBe(false);
  });

  it("maps a position card with its own currency and return", async () => {
    const { presenter } = build([investmentDto({ currency: "ARS", investedAmount: "1000", currentValue: "1100" })]);

    presenter.start();
    await flush();

    const item = presenter.model.investments[0];
    expect(item.typeLabel).toBe("Plazo fijo");
    expect(item.returnLabel).toBe("+10.0%");
    expect(item.positive).toBe(true);
    expect(item.investedLabel).toContain("1.000");
  });

  it("shows the empty state and no summaries when there are no positions", async () => {
    const { presenter } = build([]);

    presenter.start();
    await flush();

    expect(presenter.model.emptyState?.title).toBe("Todavía no hay inversiones");
    expect(presenter.model.summaries).toHaveLength(0);
  });

  it("exposes account options and creates with defaults applied", async () => {
    const { presenter, createInvestment } = build([], [accountDto({ id: "a1", name: "Brubank" })]);
    presenter.start();
    await flush();
    presenter.toggleForm();

    expect(presenter.model.form?.accountOptions).toEqual([
      { value: "", label: "Sin cuenta asociada" },
      { value: "a1", label: "Brubank" },
    ]);

    presenter.setFormField("name", " FCI ");
    presenter.setFormField("investedAmount", "5000");

    await presenter.submit();

    expect(createInvestment).toHaveBeenCalledWith({
      name: "FCI",
      type: "plazo_fijo",
      accountId: null,
      currency: "ARS",
      investedAmount: "5000",
      currentValue: "5000",
      startDate: "2026-06-14",
      endDate: null,
      rate: null,
      notes: null,
    });
  });

  it("requires name, invested amount and start date before creating", async () => {
    const { presenter, createInvestment } = build([]);
    presenter.start();
    await flush();
    presenter.toggleForm();

    presenter.setFormField("name", "FCI");
    presenter.setFormField("startDate", "");
    await presenter.submit();
    expect(createInvestment).not.toHaveBeenCalled();
  });

  it("edits a position valuation, nulling empty rate/notes", async () => {
    const { presenter, updateInvestment } = build([
      investmentDto({ id: "i1", currentValue: "1100", rate: "5", notes: "nota" }),
    ]);
    presenter.start();
    await flush();

    presenter.startEdit("i1");
    expect(presenter.model.investments[0].editingCurrentValue).toBe("1100");
    expect(presenter.model.investments[0].editingRate).toBe("5");

    presenter.setEditField("currentValue", "1300");
    presenter.setEditField("rate", "");
    presenter.setEditField("notes", "");

    await presenter.saveEdit();

    expect(updateInvestment).toHaveBeenCalledWith("i1", {
      currentValue: "1300",
      rate: null,
      notes: null,
    });
    expect(presenter.model.investments[0].isEditing).toBe(false);
  });
});
