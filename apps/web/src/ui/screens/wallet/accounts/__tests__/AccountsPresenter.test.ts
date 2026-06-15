import type { Account } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { AccountsPresenter } from "../AccountsPresenter";

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "a1",
    name: "Brubank",
    currency: "ARS",
    type: "bank",
    initialBalance: "1000",
    currentBalance: "1500",
    isActive: true,
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function build(accounts: Account[] = [account()]) {
  const gateway = new FakeWalletGateway();
  const getAccounts = vi.spyOn(gateway, "getAccounts").mockResolvedValue(accounts);
  const createAccount = vi.spyOn(gateway, "createAccount");
  const updateAccount = vi.spyOn(gateway, "updateAccount");
  const deleteAccount = vi.spyOn(gateway, "deleteAccount");
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
  const presenter = new AccountsPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway, getAccounts, createAccount, updateAccount, deleteAccount };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("AccountsPresenter", () => {
  it("loads accounts and maps them to view models", async () => {
    const { presenter } = build([account({ name: "Brubank", currentBalance: "1500", initialBalance: "1000" })]);

    presenter.start();
    await flush();

    expect(presenter.model.isLoading).toBe(false);
    expect(presenter.model.accounts).toHaveLength(1);
    expect(presenter.model.accounts[0].name).toBe("Brubank");
    expect(presenter.model.accounts[0].metaLabel).toBe("Banco · ARS");
    expect(presenter.model.accounts[0].currentBalanceLabel).toContain("1.500");
    expect(presenter.model.accounts[0].initialBalanceLabel).toContain("1.000");
  });

  it("shows the empty state when there are no accounts", async () => {
    const { presenter } = build([]);

    presenter.start();
    await flush();

    expect(presenter.model.emptyState?.title).toBe("Todavía no hay cuentas");
    expect(presenter.model.accounts).toHaveLength(0);
  });

  it("toggles the create form and edits its fields", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    expect(presenter.model.form).toBeNull();

    presenter.toggleForm();
    expect(presenter.model.form?.canSubmit).toBe(false);

    presenter.setFormField("name", "Efectivo");
    presenter.setFormField("type", "cash");
    presenter.setFormField("currency", "USD");
    expect(presenter.model.form?.type).toBe("cash");
    expect(presenter.model.form?.currency).toBe("USD");
    expect(presenter.model.form?.canSubmit).toBe(true);
  });

  it("creates an account, defaulting initial balance and resetting the form", async () => {
    const { presenter, createAccount } = build();
    presenter.start();
    await flush();
    presenter.toggleForm();
    presenter.setFormField("name", "  Efectivo  ");

    await presenter.submit();

    expect(createAccount).toHaveBeenCalledWith({
      name: "Efectivo",
      type: "bank",
      currency: "ARS",
      initialBalance: "0",
    });
    expect(presenter.model.form).toBeNull();
  });

  it("does not submit an empty name", async () => {
    const { presenter, createAccount } = build();
    presenter.start();
    await flush();
    presenter.toggleForm();

    await presenter.submit();

    expect(createAccount).not.toHaveBeenCalled();
  });

  it("renames an account through an inline edit", async () => {
    const { presenter, updateAccount } = build();
    presenter.start();
    await flush();

    presenter.startEdit("a1", "Brubank");
    presenter.setEditingName("Brubank Pro");
    expect(presenter.model.accounts[0].isEditing).toBe(true);

    await presenter.saveEdit();

    expect(updateAccount).toHaveBeenCalledWith("a1", { name: "Brubank Pro" });
    expect(presenter.model.accounts[0].isEditing).toBe(false);
  });

  it("deletes an account and surfaces busy state while in flight", async () => {
    const { presenter, gateway, deleteAccount } = build();
    let resolveDelete!: () => void;
    deleteAccount.mockReturnValue(new Promise<void>((res) => (resolveDelete = res)));
    vi.spyOn(gateway, "getAccounts").mockResolvedValue([account()]);
    presenter.start();
    await flush();

    const action = presenter.deleteAccount("a1");
    await flush();
    expect(presenter.model.accounts[0].isBusy).toBe(true);

    resolveDelete();
    await action;
    await flush();
    expect(deleteAccount).toHaveBeenCalledWith("a1");
    expect(presenter.model.accounts[0].isBusy).toBe(false);
  });
});
