import type { Transaction as TransactionDto, TransactionType, Currency } from "@vdp/shared";

export type { TransactionType };

/**
 * A wallet transaction. Rich model: it owns the income/expense/transfer
 * classification the views read off the raw type. Read-only; mutations go
 * through the gateway. Spanish labels, signs and tone classes stay in the
 * presenter.
 */
export class Transaction {
  private constructor(
    readonly id: string,
    readonly accountId: string,
    readonly categoryId: string | null,
    readonly categoryName: string | undefined,
    readonly type: TransactionType,
    readonly amount: string,
    readonly currency: Currency,
    readonly description: string | null,
    readonly date: string,
    readonly transferToAccountId: string | null | undefined,
    readonly tags: string[],
    readonly createdAt: string,
    readonly updatedAt: string | undefined,
  ) {}

  static from(dto: TransactionDto): Transaction {
    return new Transaction(
      dto.id,
      dto.accountId,
      dto.categoryId,
      dto.categoryName,
      dto.type,
      dto.amount,
      dto.currency,
      dto.description,
      dto.date,
      dto.transferToAccountId,
      dto.tags,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  get isIncome(): boolean {
    return this.type === "income";
  }

  get isExpense(): boolean {
    return this.type === "expense";
  }

  get isTransfer(): boolean {
    return this.type === "transfer";
  }

  /** Signed contribution to a balance: +amount for income, -amount for expense, 0 for transfer. */
  get signedAmount(): number {
    if (this.isIncome) return Number(this.amount);
    if (this.isExpense) return -Number(this.amount);
    return 0;
  }
}

export type WalletTransactionFilters = {
  limit: string;
  offset: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  categoryId?: string;
};

type WalletTransactionFilterSeed = {
  from?: string | string[];
  to?: string | string[];
  type?: string | string[];
  categoryId?: string | string[];
};

export interface TransactionPagination {
  currentPage: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function buildTransactionPagination(
  filters: WalletTransactionFilters,
  total: number,
): TransactionPagination {
  const limit = Number(filters.limit || "20");
  const offset = Number(filters.offset || "0");

  return {
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
    canGoPrevious: offset > 0,
    canGoNext: offset + limit < total,
  };
}

export interface VisibleTransactionTotal {
  amount: number;
  /** The single currency of the set, or null when it spans more than one. */
  currency: Currency | null;
  mixedCurrencies: boolean;
}

/**
 * Net of the visible transactions (income positive, expense negative). Money is
 * never summed across currencies: when the set spans more than one currency the
 * total is flagged as mixed so the view can refuse to show a single figure.
 */
export function buildVisibleTransactionTotal(
  transactions: readonly Transaction[],
): VisibleTransactionTotal {
  const currencies = [...new Set(transactions.map((transaction) => transaction.currency))];
  const amount = transactions.reduce((sum, transaction) => sum + transaction.signedAmount, 0);

  return {
    amount,
    currency: currencies.length === 1 ? currencies[0] : null,
    mixedCurrencies: currencies.length > 1,
  };
}

function takeFirstQueryValue(value?: string | string[]): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

export function buildInitialTransactionFilters(
  seed?: WalletTransactionFilterSeed,
): WalletTransactionFilters {
  const type = takeFirstQueryValue(seed?.type);

  return {
    limit: "20",
    offset: "0",
    from: takeFirstQueryValue(seed?.from) || undefined,
    to: takeFirstQueryValue(seed?.to) || undefined,
    type: type === "income" || type === "expense" || type === "transfer" ? type : undefined,
    categoryId: takeFirstQueryValue(seed?.categoryId) || undefined,
  };
}
