import type {
  Currency,
  AccountType,
  TransactionType,
  CategoryType,
  InvestmentType,
  ExchangeRateType,
} from "./common";

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  type: AccountType;
  initialBalance: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountWithBalance extends Account {
  currentBalance: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  parentId: string | null;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: string;
  currency: Currency;
  description: string | null;
  date: string;
  transferToAccountId: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: Currency;
  deadline: string | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  transactionId: string | null;
  amount: string;
  date: string;
  note: string | null;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  accountId: string | null;
  currency: Currency;
  investedAmount: string;
  currentValue: string;
  startDate: string;
  endDate: string | null;
  rate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  type: ExchangeRateType;
  date: string;
  createdAt: Date;
}
