import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { ObjectiveMetricSource } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { ArchiveObjective } from "@/core/app/objectives/ArchiveObjective";
import { CreateObjective } from "@/core/app/objectives/CreateObjective";
import { ListObjectives } from "@/core/app/objectives/ListObjectives";
import { MarkObjectiveAchieved } from "@/core/app/objectives/MarkObjectiveAchieved";
import { objectiveMetricSourceCatalog, resolveObjectiveCurrentValue } from "@/core/app/objectives/metric-sources";
import { UpdateObjective } from "@/core/app/objectives/UpdateObjective";
import { Objective, sortObjectives } from "@/core/domain/objectives/Objective";
import { formatTaskDate, getTodayISO } from "@/lib/format";
import type { ObjectivesViewModel } from "@/ui/models/objectives/ObjectivesViewModel";

type ObjectiveFormState = {
  isOpen: boolean;
  editingId: string | null;
  isSaving: boolean;
  title: string;
  periodStart: string;
  periodEnd: string;
  metricSource: ObjectiveMetricSource;
  target: string;
  unit: string;
  manualValue: string;
  currency: "ARS" | "USD";
};

const metricSourceOptions = [
  { value: "projects_hours" as const, label: "Horas de proyectos" },
  { value: "tasks_completed" as const, label: "Tareas completadas" },
  { value: "wallet_savings" as const, label: "Ahorro (Wallet)" },
  { value: "manual" as const, label: "Manual" },
];

export class ObjectivesPresenter extends PresenterBase<ObjectivesViewModel> {
  private objectives: Objective[] = [];
  private currentValues = new Map<string, number>();
  private isLoading = true;
  private error: string | null = null;
  private form: ObjectiveFormState = this.emptyForm();

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): ObjectivesViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  openCreateForm(): void {
    this.form = this.emptyForm({ isOpen: true });
    this.refresh();
  }

  openEditForm(id: string): void {
    const objective = this.objectives.find((candidate) => candidate.id === id);
    if (!objective) return;
    this.form = {
      isOpen: true,
      editingId: objective.id,
      isSaving: false,
      title: objective.title,
      periodStart: objective.periodStart,
      periodEnd: objective.periodEnd,
      metricSource: objective.metricSource,
      target: String(objective.target),
      unit: objective.unit,
      manualValue: objective.manualValue === null ? "" : String(objective.manualValue),
      currency: objective.currency ?? "ARS",
    };
    this.refresh();
  }

  closeForm(): void {
    this.form = this.emptyForm();
    this.refresh();
  }

  applyCurrentQuarterPreset(): void {
    const { start, end } = currentQuarterPeriod();
    this.form.periodStart = start;
    this.form.periodEnd = end;
    this.refresh();
  }

  applyCurrentYearPreset(): void {
    const year = Number(getTodayISO().slice(0, 4));
    this.form.periodStart = `${year}-01-01`;
    this.form.periodEnd = `${year}-12-31`;
    this.refresh();
  }

  setTitle(title: string): void {
    this.form.title = title;
    this.refresh();
  }

  setPeriodStart(periodStart: string): void {
    this.form.periodStart = periodStart;
    this.refresh();
  }

  setPeriodEnd(periodEnd: string): void {
    this.form.periodEnd = periodEnd;
    this.refresh();
  }

  setMetricSource(metricSource: ObjectiveMetricSource): void {
    this.form.metricSource = metricSource;
    if (metricSource === "projects_hours") {
      this.form.unit = "h";
      this.form.manualValue = "";
    }
    if (metricSource === "tasks_completed") {
      this.form.unit = "tareas";
      this.form.manualValue = "";
    }
    if (metricSource === "wallet_savings") {
      this.form.unit = this.form.currency;
      this.form.manualValue = "";
    }
    this.refresh();
  }

  setCurrency(currency: "ARS" | "USD"): void {
    this.form.currency = currency;
    if (objectiveMetricSourceCatalog[this.form.metricSource].isCurrencyScoped) {
      this.form.unit = currency;
    }
    this.refresh();
  }

  setTarget(target: string): void {
    this.form.target = target;
    this.refresh();
  }

  setUnit(unit: string): void {
    this.form.unit = unit;
    this.refresh();
  }

  setManualValue(manualValue: string): void {
    this.form.manualValue = manualValue;
    this.refresh();
  }

  async saveForm(): Promise<void> {
    if (!this.canSubmit() || this.form.isSaving) return;
    this.form.isSaving = true;
    this.refresh();
    const input = {
      title: this.form.title.trim(),
      periodStart: this.form.periodStart,
      periodEnd: this.form.periodEnd,
      metricSource: this.form.metricSource,
      target: Number(this.form.target),
      unit: this.form.unit.trim(),
      manualValue: this.form.metricSource === "manual" && this.form.manualValue.trim() !== ""
        ? Number(this.form.manualValue)
        : null,
      currency: objectiveMetricSourceCatalog[this.form.metricSource].isCurrencyScoped
        ? this.form.currency
        : null,
    };
    try {
      if (this.form.editingId) {
        await this.core.execute(new UpdateObjective(this.form.editingId, input));
      } else {
        await this.core.execute(new CreateObjective(input));
      }
      this.form = this.emptyForm();
      await this.load();
    } catch {
      this.error = this.form.editingId ? "No pudimos actualizar la meta." : "No pudimos crear la meta.";
      this.form.isSaving = false;
      this.refresh();
    }
  }

  async archiveObjective(id: string): Promise<void> {
    try {
      await this.core.execute(new ArchiveObjective(id));
      await this.load();
    } catch {
      this.error = "No pudimos archivar la meta.";
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const objectives = sortObjectives(await this.core.execute(new ListObjectives()));
      const values = await Promise.all(
        objectives.map(async (objective) => [objective.id, await resolveObjectiveCurrentValue(objective, this.core)] as const),
      );
      const currentValues = new Map(values);
      this.objectives = sortObjectives(await Promise.all(
        objectives.map((objective) =>
          this.markAchievedIfReached(objective, currentValues.get(objective.id) ?? 0),
        ),
      ));
      this.currentValues = currentValues;
      this.error = null;
    } catch {
      this.error = "No pudimos cargar tus metas.";
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private canSubmit(): boolean {
    const target = Number(this.form.target);
    const manualValue = this.form.manualValue.trim() === "" ? 0 : Number(this.form.manualValue);
    return (
      this.form.title.trim().length > 0 &&
      this.form.periodStart.length > 0 &&
      this.form.periodEnd.length > 0 &&
      this.form.periodEnd >= this.form.periodStart &&
      Number.isFinite(target) &&
      target > 0 &&
      this.form.unit.trim().length > 0 &&
      (this.form.metricSource !== "manual" || (Number.isFinite(manualValue) && manualValue >= 0)) &&
      (!objectiveMetricSourceCatalog[this.form.metricSource].isCurrencyScoped ||
        this.form.currency === "ARS" || this.form.currency === "USD")
    );
  }

  private async markAchievedIfReached(objective: Objective, currentValue: number): Promise<Objective> {
    if (!objective.isActive || currentValue < objective.target) return objective;
    try {
      return await this.core.execute(new MarkObjectiveAchieved(objective.id));
    } catch (error) {
      console.error("No pudimos marcar la meta como lograda.", error);
      return objective;
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): ObjectivesViewModel {
    return {
      isLoading: this.isLoading,
      error: this.error,
      objectives: this.objectives.map((objective) => this.objectiveVM(objective)),
      metricSourceOptions,
      form: {
        ...this.form,
        isEditing: this.form.editingId !== null,
        isCurrencyScoped: objectiveMetricSourceCatalog[this.form.metricSource].isCurrencyScoped,
        canSubmit: this.canSubmit() && !this.form.isSaving,
        submitLabel: this.form.editingId ? "Guardar" : "Crear",
      },
    };
  }

  private objectiveVM(objective: Objective) {
    const currentValue = this.currentValues.get(objective.id) ?? 0;
    const progressPercent = Math.min(100, Math.max(0, Math.round((currentValue / objective.target) * 100)));
    return {
      id: objective.id,
      title: objective.title,
      periodLabel: `${formatTaskDate(objective.periodStart)} - ${formatTaskDate(objective.periodEnd)}`,
      sourceLabel: sourceLabel(objective.metricSource),
      statusLabel: statusLabel(objective.status),
      currentValueLabel: formatObjectiveValue(currentValue, objective.unit),
      targetValueLabel: formatObjectiveValue(objective.target, objective.unit),
      progressPercent,
      progressLabel: `${progressPercent}%`,
      isArchived: objective.status === "archived",
      isAchieved: objective.status === "achieved",
      tracksSavings: objective.metricSource === "wallet_savings",
    };
  }

  private emptyForm(overrides: Partial<ObjectiveFormState> = {}): ObjectiveFormState {
    const { start, end } = currentQuarterPeriod();
    return {
      isOpen: false,
      editingId: null,
      isSaving: false,
      title: "",
      periodStart: start,
      periodEnd: end,
      metricSource: "projects_hours",
      target: "",
      unit: "h",
      manualValue: "",
      currency: "ARS",
      ...overrides,
    };
  }
}

function sourceLabel(source: ObjectiveMetricSource): string {
  return {
    manual: "Manual",
    projects_hours: "Horas de proyectos",
    tasks_completed: "Tareas completadas",
    wallet_savings: "Ahorro (Wallet)",
  }[source];
}

function statusLabel(status: Objective["status"]): string {
  if (status === "achieved") return "Lograda";
  if (status === "archived") return "Archivada";
  return "Activa";
}

function formatObjectiveValue(value: number, unit: string): string {
  const formatted = value.toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  });
  return `${formatted} ${unit}`;
}

function currentQuarterPeriod(): { start: string; end: string } {
  const today = getTodayISO();
  const date = new Date(`${today}T00:00:00`);
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
  const start = localDateFromParts(date.getFullYear(), quarterStartMonth, 1);
  const endDate = new Date(date.getFullYear(), quarterStartMonth + 3, 0);
  const end = localDateFromParts(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return { start, end };
}

function localDateFromParts(year: number, monthIndex: number, day: number): string {
  return [
    String(year).padStart(4, "0"),
    String(monthIndex + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}
