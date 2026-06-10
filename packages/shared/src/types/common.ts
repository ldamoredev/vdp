// ─── API envelope ────────────────────────────────────────
//
// Shape of paginated list responses across all domains. The server builds
// these with `paginatedCollection()`; the web client consumes them as-is.
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export type PaginatedCollection<TKey extends string, TItem> = {
  [K in TKey]: TItem[];
} & PaginationMeta;

export type Currency = "ARS" | "USD";

export type AccountType = "cash" | "bank" | "crypto" | "investment";

export type TransactionType = "income" | "expense" | "transfer";

export type CategoryType = "income" | "expense";

export type InvestmentType =
  | "plazo_fijo"
  | "fci"
  | "cedear"
  | "crypto"
  | "bond"
  | "other";

export type ExchangeRateType = "official" | "blue" | "mep" | "ccl";
