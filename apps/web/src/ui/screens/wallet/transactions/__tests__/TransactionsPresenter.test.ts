import type { Account, Category, Transaction as TransactionDto } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { Transaction } from "@/core/domain/wallet/Transaction";
import { QuickAddExpensePresenter } from "../QuickAddExpensePresenter";
import { TransactionFormPresenter } from "../TransactionFormPresenter";
import { TransactionsPresenter } from "../TransactionsPresenter";

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "a1",
    name: "Efectivo",
    currency: "ARS",
    type: "cash",
    initialBalance: "0",
    isActive: true,
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function category(overrides: Partial<Category> = {}): Category {
  return { id: "c1", name: "Comida", type: "expense", icon: null, ...overrides };
}

function transactionDto(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: "tx1",
    accountId: "a1",
    categoryId: "c1",
    categoryName: "Comida",
    type: "expense",
    amount: "100",
    currency: "ARS",
    description: "Almuerzo",
    date: "2026-06-14",
    tags: [],
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function buildCore(gateway: FakeWalletGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("TransactionsPresenter", () => {
  it("loads accounts, categories and transactions from the initial filters", async () => {
    const gateway = new FakeWalletGateway();
    const getTransactions = vi.spyOn(gateway, "getTransactions").mockResolvedValue({
      transactions: [
        Transaction.from(transactionDto({ id: "tx1", type: "income", amount: "300", description: "Sueldo" })),
        Transaction.from(transactionDto({ id: "tx2", type: "expense", amount: "100", currency: "USD", description: "Cafe" })),
      ],
      total: 42,
    });
    const presenter = new TransactionsPresenter(vi.fn(), buildCore(gateway), {
      type: "expense",
      categoryId: "c1",
      limit: "20",
      offset: "0",
    });
    presenter.init(undefined);

    presenter.start();
    await flush();

    expect(getTransactions).toHaveBeenLastCalledWith({
      type: "expense",
      categoryId: "c1",
      limit: "20",
      offset: "0",
    });
    expect(presenter.model.rows.map((row) => row.descriptionLabel)).toEqual(["Sueldo", "Cafe"]);
    expect(presenter.model.pagination.label).toBe("Página 1 de 3");
    expect(presenter.model.sanity.totalAmountLabel).toBe("Varias monedas");
    expect(presenter.model.activeCategoryChip?.label).toBe("Filtro: Comida");
  });

  it("updates filters, resets the offset and reloads", async () => {
    const gateway = new FakeWalletGateway();
    const getTransactions = vi.spyOn(gateway, "getTransactions");
    const presenter = new TransactionsPresenter(vi.fn(), buildCore(gateway), {
      limit: "20",
      offset: "40",
    });
    presenter.init(undefined);
    presenter.start();
    await flush();

    await presenter.setTypeFilter("income");

    expect(getTransactions).toHaveBeenLastCalledWith({
      limit: "20",
      offset: "0",
      type: "income",
    });
    expect(presenter.model.filters.type).toBe("income");
  });

  it("paginates transactions with the current filters", async () => {
    const gateway = new FakeWalletGateway();
    const getTransactions = vi.spyOn(gateway, "getTransactions").mockResolvedValue({
      transactions: [Transaction.from(transactionDto())],
      total: 45,
    });
    const presenter = new TransactionsPresenter(vi.fn(), buildCore(gateway), {
      limit: "20",
      offset: "0",
    });
    presenter.init(undefined);
    presenter.start();
    await flush();

    await presenter.nextPage();

    expect(presenter.model.pagination.label).toBe("Página 2 de 3");
    expect(getTransactions).toHaveBeenLastCalledWith({ limit: "20", offset: "20" });
  });

  it("deletes a transaction with a row busy flag and reloads", async () => {
    const gateway = new FakeWalletGateway();
    const deleteTransaction = vi.spyOn(gateway, "deleteTransaction");
    const presenter = new TransactionsPresenter(vi.fn(), buildCore(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    const deleting = presenter.deleteTransaction("tx1");
    expect(presenter.model.rows[0].isBusy).toBe(true);
    await deleting;

    expect(deleteTransaction).toHaveBeenCalledWith("tx1");
    expect(presenter.model.rows[0].isBusy).toBe(false);
  });

  it("opens the edit sheet and saves changed fields", async () => {
    const gateway = new FakeWalletGateway();
    vi.spyOn(gateway, "getTransactions").mockResolvedValue({
      transactions: [Transaction.from(transactionDto({ description: "Almuerzo" }))],
      total: 1,
    });
    const updateTransaction = vi.spyOn(gateway, "updateTransaction");
    const presenter = new TransactionsPresenter(vi.fn(), buildCore(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.openEdit("tx1");
    presenter.setEditField("amount", "125");
    presenter.setEditField("description", "");
    await presenter.submitEdit();

    expect(updateTransaction).toHaveBeenCalledWith("tx1", {
      amount: "125",
      description: null,
    });
    expect(presenter.model.editSheet).toBeNull();
  });
});

describe("TransactionFormPresenter", () => {
  it("loads form options, validates required fields and creates a transaction", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00.000-03:00"));
    try {
      const gateway = new FakeWalletGateway();
      vi.spyOn(gateway, "getAccounts").mockResolvedValue([account({ id: "a1", name: "Caja" })]);
      vi.spyOn(gateway, "getCategories").mockResolvedValue([
        category({ id: "food", name: "Comida", type: "expense", icon: "🍔" }),
        category({ id: "salary", name: "Sueldo", type: "income" }),
      ]);
      const createTransaction = vi.spyOn(gateway, "createTransaction");
      const presenter = new TransactionFormPresenter(vi.fn(), buildCore(gateway));
      presenter.init(undefined);
      presenter.start();
      await flush();

      await presenter.submit();
      expect(presenter.model.errorMessage).toBe("Ingresá un monto");

      presenter.setFormField("amount", "250");
      presenter.setFormField("accountId", "a1");
      presenter.setFormField("categoryId", "food");
      presenter.setFormField("description", "  Almuerzo  ");
      presenter.setFormField("tags", "food, domingo");
      await presenter.submit();

      expect(createTransaction).toHaveBeenCalledWith({
        type: "expense",
        amount: "250",
        currency: "ARS",
        accountId: "a1",
        categoryId: "food",
        description: "Almuerzo",
        date: "2026-06-14",
        tags: ["food", "domingo"],
      });
      expect(presenter.model.didSubmit).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("QuickAddExpensePresenter", () => {
  it("uses recent expenses for defaults and creates a quick expense", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00.000-03:00"));
    try {
      const gateway = new FakeWalletGateway();
      vi.spyOn(gateway, "getAccounts").mockResolvedValue([
        account({ id: "cash", name: "Caja", currency: "ARS" }),
        account({ id: "bank", name: "Banco", currency: "USD" }),
      ]);
      vi.spyOn(gateway, "getCategories").mockResolvedValue([
        category({ id: "food", name: "Comida", type: "expense" }),
        category({ id: "transport", name: "Transporte", type: "expense" }),
      ]);
      vi.spyOn(gateway, "getTransactions").mockResolvedValue({
        transactions: [
          Transaction.from(transactionDto({ id: "old1", accountId: "bank", categoryId: "transport", currency: "USD" })),
          Transaction.from(transactionDto({ id: "old2", accountId: "bank", categoryId: "transport", currency: "USD" })),
          Transaction.from(transactionDto({ id: "old3", accountId: "cash", categoryId: "food" })),
        ],
        total: 3,
      });
      const createTransaction = vi.spyOn(gateway, "createTransaction");
      const presenter = new QuickAddExpensePresenter(vi.fn(), buildCore(gateway));
      presenter.init(undefined);

      presenter.start();
      await flush();

      expect(presenter.model.form.accountId).toBe("bank");
      expect(presenter.model.form.categoryId).toBe("transport");
      expect(presenter.model.form.currency).toBe("USD");

      presenter.setAmount("99");
      presenter.setDescription("  Taxi  ");
      await presenter.submit();

      expect(createTransaction).toHaveBeenCalledWith({
        type: "expense",
        amount: "99",
        currency: "USD",
        accountId: "bank",
        categoryId: "transport",
        description: "Taxi",
        date: "2026-06-14",
        tags: [],
      });
      expect(presenter.model.didSubmit).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("validates amount and account before quick-adding", async () => {
    const gateway = new FakeWalletGateway();
    vi.spyOn(gateway, "getAccounts").mockResolvedValue([]);
    vi.spyOn(gateway, "getCategories").mockResolvedValue([]);
    vi.spyOn(gateway, "getTransactions").mockResolvedValue({ transactions: [], total: 0 });
    const createTransaction = vi.spyOn(gateway, "createTransaction");
    const presenter = new QuickAddExpensePresenter(vi.fn(), buildCore(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    await presenter.submit();

    expect(presenter.model.errorMessage).toBe("Ingresá un monto");
    expect(createTransaction).not.toHaveBeenCalled();
  });
});
