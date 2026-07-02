import { describe, expect, it } from "vitest";
import type { Loan as LoanDto } from "@vdp/shared";

import { Loan, sortLoans, summarizeOutstandingByCurrency } from "../Loan";

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

describe("Loan", () => {
  it("maps a DTO and exposes open/outstanding helpers", () => {
    const loan = Loan.from(loanDto({ outstanding: "600.00" }));

    expect(loan.isOpen).toBe(true);
    expect(loan.outstandingAmount).toBe(600);
  });

  it("sorts open loans before closed ones, newest first", () => {
    const loans = [
      Loan.from(loanDto({ id: "old-open", status: "open", date: "2026-05-01" })),
      Loan.from(loanDto({ id: "repaid", status: "repaid", date: "2026-06-20", outstanding: "0.00" })),
      Loan.from(loanDto({ id: "new-open", status: "open", date: "2026-06-10" })),
    ];

    expect(sortLoans(loans).map((loan) => loan.id)).toEqual(["new-open", "old-open", "repaid"]);
  });

  it("summarizes outstanding by currency and direction without crossing currencies", () => {
    const loans = [
      Loan.from(loanDto({ currency: "USD", direction: "lent", outstanding: "600.00" })),
      Loan.from(loanDto({ currency: "USD", direction: "borrowed", outstanding: "150.00" })),
      Loan.from(loanDto({ currency: "ARS", direction: "lent", outstanding: "50000.00" })),
      Loan.from(loanDto({ currency: "USD", direction: "lent", status: "repaid", outstanding: "0.00" })),
    ];

    const summary = summarizeOutstandingByCurrency(loans);

    expect(summary).toContainEqual({ currency: "USD", lentOutstanding: "600.00", borrowedOutstanding: "150.00" });
    expect(summary).toContainEqual({ currency: "ARS", lentOutstanding: "50000.00", borrowedOutstanding: "0.00" });
  });
});
