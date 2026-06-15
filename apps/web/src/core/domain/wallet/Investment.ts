import type { Investment as InvestmentDto, InvestmentType, Currency } from "@vdp/shared";

export type { InvestmentType };

/**
 * An investment position. Rich model: it owns the invested/current/return
 * computation the views read off raw amounts. Read-only; mutations go through
 * the gateway. Spanish type labels stay in the presenter.
 */
export class Investment {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly type: InvestmentType,
    readonly accountId: string | null,
    readonly currency: Currency,
    readonly investedAmount: string,
    readonly currentValue: string,
    readonly startDate: string,
    readonly endDate: string | null,
    readonly rate: string | null,
    readonly notes: string | null,
    readonly isActive: boolean,
  ) {}

  static from(dto: InvestmentDto): Investment {
    return new Investment(
      dto.id,
      dto.name,
      dto.type,
      dto.accountId ?? null,
      dto.currency,
      dto.investedAmount,
      dto.currentValue,
      dto.startDate,
      dto.endDate,
      dto.rate,
      dto.notes,
      dto.isActive,
    );
  }

  get invested(): number {
    return Number(this.investedAmount);
  }

  get current(): number {
    return Number(this.currentValue);
  }
}

/** A per-currency rollup of a set of positions. Returns are computed within a currency. */
export interface InvestmentCurrencyTotal {
  currency: Currency;
  totalInvested: number;
  totalCurrent: number;
  /** Return percentage as a one-decimal string (e.g. "12.5"); "0.0" when nothing invested. */
  totalReturn: string;
  positive: boolean;
}

/**
 * Roll positions up per currency. Money is never summed across currencies
 * (ARS and USD totals stay separate), so the result is one entry per currency
 * present, ordered by currency code for deterministic rendering.
 */
export function buildInvestmentSummary(
  investments: readonly Investment[],
): InvestmentCurrencyTotal[] {
  const byCurrency = new Map<Currency, { invested: number; current: number }>();

  for (const investment of investments) {
    const bucket = byCurrency.get(investment.currency) ?? { invested: 0, current: 0 };
    bucket.invested += investment.invested;
    bucket.current += investment.current;
    byCurrency.set(investment.currency, bucket);
  }

  return [...byCurrency.entries()]
    .map(([currency, { invested, current }]) => ({
      currency,
      totalInvested: invested,
      totalCurrent: current,
      totalReturn:
        invested > 0 ? (((current - invested) / invested) * 100).toFixed(1) : "0.0",
      positive: current >= invested,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}
