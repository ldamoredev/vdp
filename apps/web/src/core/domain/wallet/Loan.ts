import type {
  Currency,
  Loan as LoanDto,
  LoanDirection,
  LoanPayment as LoanPaymentDto,
  LoanStatus,
} from "@vdp/shared";

/**
 * A loan (money lent to / borrowed from a counterparty). Read model: the server
 * computes `outstanding`/`paidTotal` per-currency, so the view reads them off.
 * Mutations go through the gateway; Spanish copy stays in the presenter.
 */
export class Loan {
  private constructor(
    readonly id: string,
    readonly direction: LoanDirection,
    readonly counterparty: string,
    readonly principal: string,
    readonly currency: Currency,
    readonly date: string,
    readonly dueDate: string | null,
    readonly note: string | null,
    readonly status: LoanStatus,
    readonly payments: readonly LoanPaymentDto[],
    readonly outstanding: string,
    readonly paidTotal: string,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(dto: LoanDto): Loan {
    return new Loan(
      dto.id,
      dto.direction,
      dto.counterparty,
      dto.principal,
      dto.currency,
      dto.date,
      dto.dueDate,
      dto.note,
      dto.status,
      dto.payments,
      dto.outstanding,
      dto.paidTotal,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  get isOpen(): boolean {
    return this.status === "open";
  }

  get outstandingAmount(): number {
    return Number(this.outstanding);
  }
}

/** Open loans first, then most recently dated first. Copies before sorting. */
export function sortLoans(loans: readonly Loan[]): Loan[] {
  return [...loans].sort((left, right) => {
    if (left.isOpen !== right.isOpen) return left.isOpen ? -1 : 1;
    return right.date.localeCompare(left.date);
  });
}

export interface LoanCurrencyOutstanding {
  currency: Currency;
  /** Still owed to you (open loans you made). */
  lentOutstanding: string;
  /** You still owe (open loans you took). */
  borrowedOutstanding: string;
}

/**
 * Outstanding balances grouped by currency, split by direction. Never sums
 * across currencies. Closed loans contribute 0 (their outstanding is 0).
 */
export function summarizeOutstandingByCurrency(loans: readonly Loan[]): LoanCurrencyOutstanding[] {
  const byCurrency = new Map<Currency, { lent: number; borrowed: number }>();
  for (const loan of loans) {
    const bucket = byCurrency.get(loan.currency) ?? { lent: 0, borrowed: 0 };
    if (loan.direction === "lent") bucket.lent += loan.outstandingAmount;
    else bucket.borrowed += loan.outstandingAmount;
    byCurrency.set(loan.currency, bucket);
  }
  return Array.from(byCurrency.entries()).map(([currency, bucket]) => ({
    currency,
    lentOutstanding: bucket.lent.toFixed(2),
    borrowedOutstanding: bucket.borrowed.toFixed(2),
  }));
}
