"use client";

import { useState } from "react";
import { getTodayISO } from "@/lib/format";
import type { Currency, AccountType, CategoryType, InvestmentType } from "@/lib/api/types";
import type {
  AccountFormState,
  CategoryFormState,
  InvestmentFormState,
  SavingsFormState,
} from "./wallet-selectors";

function createInitialAccountForm(): AccountFormState {
  return {
    name: "",
    currency: "ARS",
    type: "bank",
    initialBalance: "",
  };
}

function createInitialCategoryForm(): CategoryFormState {
  return {
    name: "",
    type: "expense",
    icon: "",
  };
}

function createInitialSavingsForm(): SavingsFormState {
  return {
    name: "",
    targetAmount: "",
    currency: "ARS",
    deadline: "",
  };
}

function createInitialInvestmentForm(): InvestmentFormState {
  return {
    name: "",
    type: "plazo_fijo",
    accountId: "",
    currency: "ARS",
    investedAmount: "",
    currentValue: "",
    startDate: getTodayISO(),
    endDate: "",
    rate: "",
    notes: "",
  };
}

export function useWalletCreation(actions: {
  createAccount: (input: {
    name: string;
    currency: Currency;
    type: AccountType;
    initialBalance: string;
  }) => Promise<unknown>;
  createCategory: (input: {
    name: string;
    type: CategoryType;
    icon: string | null;
  }) => Promise<unknown>;
  createSavingsGoal: (input: {
    name: string;
    targetAmount: string;
    currency: Currency;
    deadline: string | null;
  }) => Promise<unknown>;
  contributeSavings: (input: {
    id: string;
    amount: string;
    date?: string;
    note?: string;
  }) => Promise<unknown>;
  createInvestment: (input: {
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
  }) => Promise<unknown>;
}) {
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormState>(
    createInitialAccountForm(),
  );
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(
    createInitialCategoryForm(),
  );
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [savingsForm, setSavingsForm] = useState<SavingsFormState>(
    createInitialSavingsForm(),
  );
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [investmentForm, setInvestmentForm] = useState<InvestmentFormState>(
    createInitialInvestmentForm(),
  );

  async function submitAccount() {
    await actions.createAccount({
      ...accountForm,
      initialBalance: accountForm.initialBalance || "0",
    });
    setShowAccountForm(false);
    setAccountForm(createInitialAccountForm());
  }

  async function submitCategory() {
    await actions.createCategory({
      name: categoryForm.name,
      type: categoryForm.type,
      icon: categoryForm.icon || null,
    });
    setShowCategoryForm(false);
    setCategoryForm(createInitialCategoryForm());
  }

  async function submitSavingsGoal() {
    await actions.createSavingsGoal({
      ...savingsForm,
      deadline: savingsForm.deadline || null,
    });
    setShowSavingsForm(false);
    setSavingsForm(createInitialSavingsForm());
  }

  async function submitContribution() {
    if (!contributeId || !contributeAmount) return;

    await actions.contributeSavings({
      id: contributeId,
      amount: contributeAmount,
      date: getTodayISO(),
    });
    setContributeId(null);
    setContributeAmount("");
  }

  async function submitInvestment() {
    await actions.createInvestment({
      name: investmentForm.name,
      type: investmentForm.type,
      accountId: investmentForm.accountId || null,
      currency: investmentForm.currency,
      investedAmount: investmentForm.investedAmount,
      currentValue:
        investmentForm.currentValue || investmentForm.investedAmount,
      startDate: investmentForm.startDate,
      endDate: investmentForm.endDate || null,
      rate: investmentForm.rate || null,
      notes: investmentForm.notes || null,
    });
    setShowInvestmentForm(false);
    setInvestmentForm(createInitialInvestmentForm());
  }

  return {
    showAccountForm,
    accountForm,
    showCategoryForm,
    categoryForm,
    showSavingsForm,
    savingsForm,
    contributeId,
    contributeAmount,
    showInvestmentForm,
    investmentForm,
    setShowAccountForm,
    setAccountForm,
    setShowCategoryForm,
    setCategoryForm,
    setShowSavingsForm,
    setSavingsForm,
    setContributeId,
    setContributeAmount,
    setShowInvestmentForm,
    setInvestmentForm,
    submitAccount,
    submitCategory,
    submitSavingsGoal,
    submitContribution,
    submitInvestment,
  };
}
