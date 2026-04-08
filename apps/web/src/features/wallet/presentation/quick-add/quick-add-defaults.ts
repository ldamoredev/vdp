import type { Account, Category, Currency, Transaction } from "@/lib/api/types";

function pickMostFrequent<T extends string>(values: readonly T[]): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let bestValue: T | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestValue = value;
    }
  }
  return bestValue;
}

export function pickDefaultAccountId(
  accounts: readonly Account[],
  recentTransactions: readonly Transaction[],
): string {
  if (accounts.length === 0) return "";
  const validIds = new Set(accounts.map((account) => account.id));
  const usedAccountIds = recentTransactions
    .filter((transaction) => transaction.type === "expense")
    .map((transaction) => transaction.accountId)
    .filter((id): id is string => typeof id === "string" && validIds.has(id));
  const mostFrequent = pickMostFrequent(usedAccountIds);
  return mostFrequent ?? accounts[0].id;
}

export function pickDefaultCategoryId(
  categories: readonly Category[],
  recentTransactions: readonly Transaction[],
): string {
  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );
  if (expenseCategories.length === 0) return "";
  const validIds = new Set(expenseCategories.map((category) => category.id));
  const usedCategoryIds = recentTransactions
    .filter((transaction) => transaction.type === "expense")
    .map((transaction) => transaction.categoryId)
    .filter((id): id is string => typeof id === "string" && validIds.has(id));
  const mostFrequent = pickMostFrequent(usedCategoryIds);
  return mostFrequent ?? expenseCategories[0].id;
}

export function pickDefaultCurrency(
  accounts: readonly Account[],
  defaultAccountId: string,
): Currency {
  const account = accounts.find((candidate) => candidate.id === defaultAccountId);
  return account?.currency ?? "ARS";
}
