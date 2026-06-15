import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { CreateAccount } from "@/core/app/wallet/CreateAccount";
import { DeleteAccount } from "@/core/app/wallet/DeleteAccount";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { UpdateAccount } from "@/core/app/wallet/UpdateAccount";
import type { Account, AccountType } from "@/core/domain/wallet/Account";
import { formatMoney } from "@/lib/format";
import type {
  AccountFormField,
  AccountItemVM,
  AccountsViewModel,
  WalletEmptyStateVM,
} from "@/ui/models/wallet/AccountsViewModel";
import { ACCOUNT_TYPE_LABELS, walletEmptyState, walletScreenIntro } from "../wallet-copy";

interface AccountFormState {
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: string;
}

const TYPE_OPTIONS = [
  { value: "bank", label: ACCOUNT_TYPE_LABELS.bank },
  { value: "cash", label: ACCOUNT_TYPE_LABELS.cash },
  { value: "crypto", label: ACCOUNT_TYPE_LABELS.crypto },
  { value: "investment", label: ACCOUNT_TYPE_LABELS.investment },
];

const CURRENCY_OPTIONS = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
];

function emptyForm(): AccountFormState {
  return { name: "", type: "bank", currency: "ARS", initialBalance: "" };
}

/**
 * Drives the accounts screen: loads the account list and owns the create form
 * and per-row inline rename/delete. Mutations go through the Core bus and reload
 * the list. Spanish copy and CSS tone classes live here; the view is humble.
 */
export class AccountsPresenter extends PresenterBase<AccountsViewModel> {
  private accounts: Account[] = [];
  private isLoading = true;
  private error = false;

  private showForm = false;
  private form: AccountFormState = emptyForm();
  private isCreating = false;

  private editingId: string | null = null;
  private editingName = "";
  private busyIds = new Set<string>();

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): AccountsViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  stop(): void {}

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.form = emptyForm();
    this.refresh();
  }

  setFormField(field: AccountFormField, value: string): void {
    if (field === "type") this.form.type = value as AccountType;
    else if (field === "currency") this.form.currency = value as Currency;
    else this.form[field] = value;
    this.refresh();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.isCreating = true;
    this.refresh();
    try {
      await this.core.execute(
        new CreateAccount({
          name: this.form.name.trim(),
          type: this.form.type,
          currency: this.form.currency,
          initialBalance: this.form.initialBalance || "0",
        }),
      );
      this.showForm = false;
      this.form = emptyForm();
      await this.load();
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  startEdit(id: string, currentName: string): void {
    this.editingId = id;
    this.editingName = currentName;
    this.refresh();
  }

  setEditingName(value: string): void {
    this.editingName = value;
    this.refresh();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingName = "";
    this.refresh();
  }

  async saveEdit(): Promise<void> {
    const id = this.editingId;
    const name = this.editingName.trim();
    if (!id || name.length === 0) return;
    await this.runForId(id, async () => {
      await this.core.execute(new UpdateAccount(id, { name }));
      this.editingId = null;
      this.editingName = "";
      await this.load();
    });
  }

  async deleteAccount(id: string): Promise<void> {
    await this.runForId(id, async () => {
      await this.core.execute(new DeleteAccount(id));
      await this.load();
    });
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      this.accounts = await this.core.execute(new GetAccounts());
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private async runForId(id: string, block: () => Promise<void>): Promise<void> {
    if (this.busyIds.has(id)) return;
    this.busyIds.add(id);
    this.refresh();
    try {
      await block();
    } finally {
      this.busyIds.delete(id);
      this.refresh();
    }
  }

  private canSubmit(): boolean {
    return this.form.name.trim().length > 0 && !this.isCreating;
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): AccountsViewModel {
    return {
      title: "Cuentas",
      intro: walletScreenIntro("accounts"),
      addButtonLabel: "Nueva cuenta",
      form: this.showForm
        ? {
            name: this.form.name,
            type: this.form.type,
            currency: this.form.currency,
            initialBalance: this.form.initialBalance,
            typeOptions: TYPE_OPTIONS,
            currencyOptions: CURRENCY_OPTIONS,
            submitLabel: this.isCreating ? "Creando..." : "Guardar cuenta",
            isSubmitting: this.isCreating,
            canSubmit: this.canSubmit(),
          }
        : null,
      accounts: this.accounts.map((account) => this.accountVM(account)),
      emptyState:
        !this.isLoading && this.accounts.length === 0 ? this.emptyStateVM() : null,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private accountVM(account: Account): AccountItemVM {
    const currency = account.currency as "ARS" | "USD";
    const balance = Number(account.currentBalance ?? account.initialBalance);
    return {
      id: account.id,
      name: account.name,
      metaLabel: `${ACCOUNT_TYPE_LABELS[account.type]} · ${account.currency}`,
      currentBalanceLabel: formatMoney(balance, currency),
      initialBalanceLabel: formatMoney(Number(account.initialBalance), currency),
      isEditing: this.editingId === account.id,
      editingName: this.editingId === account.id ? this.editingName : "",
      isBusy: this.busyIds.has(account.id),
    };
  }

  private emptyStateVM(): WalletEmptyStateVM {
    return walletEmptyState("accounts");
  }
}
