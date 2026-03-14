export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
