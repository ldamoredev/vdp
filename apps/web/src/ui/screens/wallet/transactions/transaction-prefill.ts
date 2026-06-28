import type { Currency, TransactionType } from "@vdp/shared";

export interface WalletTransactionPrefill {
  type?: TransactionType;
  amount?: string;
  currency?: Currency;
  description?: string;
}

const TRANSACTION_TYPES = new Set<TransactionType>(["income", "expense", "transfer"]);
const CURRENCIES = new Set<Currency>(["ARS", "USD"]);

export function parseWalletTransactionPrefill(searchParams: URLSearchParams): WalletTransactionPrefill {
  const legacyExpenseDescription = searchParams.get("registrar-gasto");
  if (legacyExpenseDescription) {
    return {
      type: "expense",
      description: legacyExpenseDescription,
    };
  }

  const type = searchParams.get("type");
  const currency = searchParams.get("currency");
  const prefill: WalletTransactionPrefill = {};
  if (isTransactionType(type)) prefill.type = type;
  if (searchParams.has("amount")) prefill.amount = searchParams.get("amount") ?? "";
  if (isCurrency(currency)) prefill.currency = currency;
  if (searchParams.has("description")) prefill.description = searchParams.get("description") ?? "";
  return prefill;
}

function isTransactionType(value: string | null): value is TransactionType {
  return value !== null && TRANSACTION_TYPES.has(value as TransactionType);
}

function isCurrency(value: string | null): value is Currency {
  return value !== null && CURRENCIES.has(value as Currency);
}
