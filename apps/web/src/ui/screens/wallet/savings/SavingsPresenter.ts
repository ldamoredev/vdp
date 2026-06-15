import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { ContributeSavings } from "@/core/app/wallet/ContributeSavings";
import { CreateSavingsGoal } from "@/core/app/wallet/CreateSavingsGoal";
import { GetSavings } from "@/core/app/wallet/GetSavings";
import type { SavingsGoal } from "@/core/domain/wallet/SavingsGoal";
import { formatDate, formatMoney, getTodayISO } from "@/lib/format";
import type {
  SavingsFormField,
  SavingsGoalVM,
  SavingsViewModel,
} from "@/ui/models/wallet/SavingsViewModel";
import { walletEmptyState, walletScreenIntro } from "../wallet-copy";

interface SavingsFormState {
  name: string;
  targetAmount: string;
  currency: Currency;
  deadline: string;
}

const CURRENCY_OPTIONS = [
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
];

function emptyForm(): SavingsFormState {
  return { name: "", targetAmount: "", currency: "ARS", deadline: "" };
}

/**
 * Drives the savings screen: loads the goals (progress comes from the domain
 * model), owns the create form and the per-goal inline contribution. Mutations
 * go through the Core bus and reload. Spanish copy lives here; the view is humble.
 */
export class SavingsPresenter extends PresenterBase<SavingsViewModel> {
  private goals: SavingsGoal[] = [];
  private isLoading = true;
  private error = false;

  private showForm = false;
  private form: SavingsFormState = emptyForm();
  private isCreating = false;

  private contributeId: string | null = null;
  private contributeAmount = "";
  private isContributing = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): SavingsViewModel {
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

  setFormField(field: SavingsFormField, value: string): void {
    if (field === "currency") this.form.currency = value as Currency;
    else this.form[field] = value;
    this.refresh();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.isCreating = true;
    this.refresh();
    try {
      await this.core.execute(
        new CreateSavingsGoal({
          name: this.form.name.trim(),
          targetAmount: this.form.targetAmount,
          currency: this.form.currency,
          deadline: this.form.deadline || null,
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

  startContribution(goalId: string): void {
    this.contributeId = goalId;
    this.contributeAmount = "";
    this.refresh();
  }

  cancelContribution(): void {
    this.contributeId = null;
    this.contributeAmount = "";
    this.refresh();
  }

  setContributeAmount(value: string): void {
    this.contributeAmount = value;
    this.refresh();
  }

  async submitContribution(): Promise<void> {
    if (!this.contributeId || !this.contributeAmount || this.isContributing) return;
    const id = this.contributeId;
    this.isContributing = true;
    this.refresh();
    try {
      await this.core.execute(
        new ContributeSavings(id, { amount: this.contributeAmount, date: getTodayISO() }),
      );
      this.contributeId = null;
      this.contributeAmount = "";
      await this.load();
    } finally {
      this.isContributing = false;
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      this.goals = await this.core.execute(new GetSavings());
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private canSubmit(): boolean {
    return (
      this.form.name.trim().length > 0 &&
      this.form.targetAmount.trim().length > 0 &&
      !this.isCreating
    );
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): SavingsViewModel {
    return {
      title: "Ahorros",
      intro: walletScreenIntro("savings"),
      addButtonLabel: "Nuevo objetivo",
      form: this.showForm
        ? {
            name: this.form.name,
            targetAmount: this.form.targetAmount,
            currency: this.form.currency,
            deadline: this.form.deadline,
            currencyOptions: CURRENCY_OPTIONS,
            submitLabel: this.isCreating ? "Creando..." : "Crear meta",
            isSubmitting: this.isCreating,
            canSubmit: this.canSubmit(),
          }
        : null,
      goals: this.goals.map((goal) => this.goalVM(goal)),
      emptyState: !this.isLoading && this.goals.length === 0 ? walletEmptyState("savings") : null,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private goalVM(goal: SavingsGoal): SavingsGoalVM {
    const currency = goal.currency as "ARS" | "USD";
    const isContributing = this.contributeId === goal.id;
    return {
      id: goal.id,
      name: goal.name,
      isCompleted: goal.isCompleted,
      hasDeadline: goal.deadline !== null,
      deadlineLabel: goal.deadline ? formatDate(goal.deadline) : "Sin fecha limite",
      currentLabel: formatMoney(goal.current, currency),
      targetLabel: formatMoney(goal.target, currency),
      progressPercent: goal.progress,
      progressLabel: `${goal.progress.toFixed(0)}%`,
      accumulatedLabel: "acumulado",
      isContributing,
      contributeAmount: isContributing ? this.contributeAmount : "",
      isSubmittingContribution: isContributing && this.isContributing,
      canSubmitContribution: isContributing && this.contributeAmount.trim().length > 0,
    };
  }
}
