import type {
  Account,
  Category,
  Currency,
  AccountType,
  TransactionType,
  CategoryType,
  InvestmentType,
  ExchangeRate,
  Investment,
  SavingsGoal,
  Transaction,
} from "@/lib/api/types";

export type WalletScope =
  | "dashboard"
  | "accounts"
  | "categories"
  | "stats"
  | "savings"
  | "investments"
  | "transactions";

export type AccountFormState = {
  name: string;
  currency: Currency;
  type: AccountType;
  initialBalance: string;
};

export type CategoryFormState = {
  name: string;
  type: CategoryType;
  icon: string;
};

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

export type SavingsFormState = {
  name: string;
  targetAmount: string;
  currency: Currency;
  deadline: string;
};

export type InvestmentFormState = {
  name: string;
  type: InvestmentType;
  accountId: string;
  currency: Currency;
  investedAmount: string;
  currentValue: string;
  startDate: string;
  endDate: string;
  rate: string;
  notes: string;
};

export type TransactionFormState = {
  type: Transaction["type"];
  amount: string;
  currency: "ARS" | "USD";
  accountId: string;
  categoryId: string;
  description: string;
  date: string;
  tags: string;
};

export const accountTypeLabels: Record<Account["type"], string> = {
  cash: "Efectivo",
  bank: "Banco",
  crypto: "Crypto",
  investment: "Inversion",
};

export const investmentTypeLabels: Record<InvestmentType, string> = {
  plazo_fijo: "Plazo fijo",
  fci: "FCI",
  cedear: "CEDEAR",
  crypto: "Crypto",
  bond: "Bono",
  other: "Otro",
};

export function groupCategoriesByType(categories: Category[]) {
  return {
    expense: categories.filter((category) => category.type === "expense"),
    income: categories.filter((category) => category.type === "income"),
  };
}

export function latestDollarRates(rates: ExchangeRate[]): ExchangeRate[] {
  return rates
    .filter(
      (rate) => rate.fromCurrency === "USD" && rate.toCurrency === "ARS",
    )
    .sort((a, b) => a.type.localeCompare(b.type));
}

export function calculateSavingsProgress(goal: SavingsGoal) {
  const current = Number(goal.currentAmount);
  const target = Number(goal.targetAmount);
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return {
    current,
    target,
    progress,
  };
}

export function buildInvestmentSummary(investments: Investment[]) {
  const totalInvested = investments.reduce(
    (sum, item) => sum + Number(item.investedAmount),
    0,
  );
  const totalCurrent = investments.reduce(
    (sum, item) => sum + Number(item.currentValue),
    0,
  );
  const totalReturn =
    totalInvested > 0
      ? (((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(1)
      : "0.0";

  return {
    totalInvested,
    totalCurrent,
    totalReturn,
    positive: totalCurrent >= totalInvested,
  };
}

export function buildTransactionPagination(
  filters: WalletTransactionFilters,
  total: number,
) {
  const limit = Number(filters.limit || "20");
  const offset = Number(filters.offset || "0");

  return {
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
    canGoPrevious: offset > 0,
    canGoNext: offset + limit < total,
  };
}

export function buildVisibleTransactionTotal(transactions: Transaction[]) {
  const currencies = [...new Set(transactions.map((transaction) => transaction.currency))];

  const amount = transactions.reduce((sum, transaction) => {
    const numericAmount = Number(transaction.amount);

    if (transaction.type === "income") return sum + numericAmount;
    if (transaction.type === "expense") return sum - numericAmount;
    return sum;
  }, 0);

  return {
    amount,
    currency: currencies.length === 1 ? currencies[0] : null,
    mixedCurrencies: currencies.length > 1,
  };
}

function takeFirstQueryValue(value?: string | string[]) {
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
    type:
      type === "income" || type === "expense" || type === "transfer"
        ? type
        : undefined,
    categoryId: takeFirstQueryValue(seed?.categoryId) || undefined,
  };
}

export function getTransactionPresentation(type: Transaction["type"]) {
  switch (type) {
    case "income":
      return {
        label: "Ingreso",
        sign: "+",
        tone: "income" as const,
      };
    case "expense":
      return {
        label: "Gasto",
        sign: "-",
        tone: "expense" as const,
      };
    default:
      return {
        label: "Transferencia",
        sign: "",
        tone: "transfer" as const,
      };
  }
}
