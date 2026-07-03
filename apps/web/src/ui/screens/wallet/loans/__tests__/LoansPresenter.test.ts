import { describe, expect, it, vi } from "vitest";
import type { Loan as LoanDto } from "@vdp/shared";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { Loan } from "@/core/domain/wallet/Loan";
import { LoansPresenter } from "../LoansPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(gateway: FakeWalletGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
}

function loanDto(overrides: Partial<LoanDto> = {}): LoanDto {
  return {
    id: "l1",
    direction: "lent",
    counterparty: "Marco",
    principal: "1000.00",
    currency: "USD",
    date: "2026-06-01",
    dueDate: null,
    note: null,
    status: "open",
    payments: [],
    outstanding: "1000.00",
    paidTotal: "0.00",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
    ...overrides,
  };
}

function presenterWith(gateway: FakeWalletGateway): LoansPresenter {
  const presenter = new LoansPresenter(vi.fn(), coreWith(gateway));
  presenter.init(undefined);
  return presenter;
}

describe("LoansPresenter", () => {
  it("loads loans, splits open from closed, and summarizes outstanding by currency", async () => {
    const gateway = new FakeWalletGateway();
    gateway.loanList = [
      Loan.from(loanDto({ id: "open-usd", outstanding: "600.00" })),
      Loan.from(loanDto({ id: "repaid", status: "repaid", outstanding: "0.00" })),
      Loan.from(loanDto({ id: "owe-usd", direction: "borrowed", outstanding: "150.00" })),
    ];
    const presenter = presenterWith(gateway);

    presenter.start();
    await flush();

    expect(presenter.model.openLoans.map((loan) => loan.id)).toEqual(["open-usd", "owe-usd"]);
    expect(presenter.model.closedLoans.map((loan) => loan.id)).toEqual(["repaid"]);
    expect(presenter.model.summary).toContainEqual(
      expect.objectContaining({ currency: "USD" }),
    );
  });

  it("creates a loan and reloads", async () => {
    const gateway = new FakeWalletGateway();
    const presenter = presenterWith(gateway);
    presenter.start();
    await flush();

    presenter.toggleForm();
    presenter.setDirection("borrowed");
    presenter.setFormField("counterparty", "Ana");
    presenter.setFormField("principal", "500.00");
    presenter.setFormField("date", "2026-06-02");
    await presenter.submit();

    expect(gateway.callsTo("createLoan")[0].args[0]).toMatchObject({
      direction: "borrowed",
      counterparty: "Ana",
      principal: "500.00",
    });
    expect(presenter.model.form).toBeNull();
    expect(gateway.callsTo("getLoans").length).toBeGreaterThanOrEqual(2);
  });

  it("registers an inline payment on a loan", async () => {
    const gateway = new FakeWalletGateway();
    const presenter = presenterWith(gateway);
    presenter.start();
    await flush();

    presenter.startPayment("l1");
    presenter.setPaymentAmount("400.00");
    await presenter.submitPayment();

    expect(gateway.callsTo("registerLoanPayment")[0].args).toEqual([
      "l1",
      { amount: "400.00", date: expect.any(String) },
    ]);
    expect(presenter.model.openLoans[0].isPaying).toBe(false);
  });

  it("marks a loan repaid and forgives a loan", async () => {
    const gateway = new FakeWalletGateway();
    const presenter = presenterWith(gateway);
    presenter.start();
    await flush();

    await presenter.markRepaid("l1");
    await presenter.forgive("l1");

    expect(gateway.callsTo("markLoanRepaid")[0].args).toEqual(["l1"]);
    expect(gateway.callsTo("forgiveLoan")[0].args).toEqual(["l1"]);
  });

  it("flags an error when loading fails", async () => {
    const gateway = new FakeWalletGateway();
    gateway.getLoans = vi.fn().mockRejectedValue(new Error("boom"));
    const presenter = presenterWith(gateway);

    presenter.start();
    await flush();

    expect(presenter.model.error).toBe(true);
    expect(presenter.model.isLoading).toBe(false);
  });
});
