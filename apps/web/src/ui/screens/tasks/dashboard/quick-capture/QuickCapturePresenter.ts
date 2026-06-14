import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { CreateTask } from "@/core/app/tasks/CreateTask";
import type {
  QuickCaptureDomainOptionVM,
  QuickCapturePriorityOptionVM,
  QuickCaptureViewModel,
} from "@/ui/models/tasks/QuickCaptureViewModel";
import type { TasksDashboardStore } from "../TasksDashboardStore";

const DEFAULT_PRIORITY = 2;
const ERROR_MESSAGE = "No se pudo agregar la tarea. Probá de nuevo.";

const PRIORITY_LABELS: Record<number, string> = {
  1: "Baja",
  2: "Media",
  3: "Alta",
};

const DOMAIN_LABELS = [
  { value: "", label: "Sin dominio" },
  { value: "wallet", label: "Finanzas" },
  { value: "health", label: "Salud" },
  { value: "work", label: "Trabajo" },
  { value: "people", label: "Gente" },
  { value: "study", label: "Estudio" },
];

/**
 * Dashboard quick capture: owns the create-task draft, dispatches CreateTask
 * through the Core, then reloads and selects the created task in the shared
 * dashboard store.
 */
export class QuickCapturePresenter extends PresenterBase<QuickCaptureViewModel> {
  private title = "";
  private priority = DEFAULT_PRIORITY;
  private domain = "";
  private isCreating = false;
  private errorMessage: string | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly store: TasksDashboardStore,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): QuickCaptureViewModel {
    return this.buildModel();
  }

  start(): void {}

  stop(): void {}

  setTitle(value: string): void {
    this.title = value;
    this.errorMessage = null;
    this.refresh();
  }

  setPriority(value: number): void {
    this.priority = value;
    this.errorMessage = null;
    this.refresh();
  }

  setDomain(value: string): void {
    this.domain = value;
    this.errorMessage = null;
    this.refresh();
  }

  async create(): Promise<void> {
    const title = this.title.trim();
    if (!title || this.isCreating) return;

    this.isCreating = true;
    this.errorMessage = null;
    this.refresh();

    try {
      const task = await this.core.execute(
        new CreateTask({
          title,
          priority: this.priority,
          domain: this.domain || undefined,
        }),
      );
      await this.store.load();
      this.store.select(task.id);
      this.store.setFilter("focus");
      this.resetDraft();
    } catch {
      this.errorMessage = ERROR_MESSAGE;
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  private resetDraft(): void {
    this.title = "";
    this.priority = DEFAULT_PRIORITY;
    this.domain = "";
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): QuickCaptureViewModel {
    return {
      title: this.title,
      priority: this.priority,
      domain: this.domain,
      priorityOptions: [1, 2, 3].map((value) => this.priorityOptionVM(value)),
      domainOptions: DOMAIN_LABELS.map((option) => this.domainOptionVM(option)),
      canCreate: this.title.trim().length > 0 && !this.isCreating,
      isCreating: this.isCreating,
      submitLabel: this.isCreating ? "Agregando..." : "Agregar a hoy",
      errorMessage: this.errorMessage,
      titlePlaceholder: "Agregar una tarea concreta para hoy...",
      titleLabel: "Captura rapida",
      priorityLabel: "Prioridad operativa",
      domainLabel: "Dominio",
      helperText: "La tarea entra directo en la cola de ejecucion y el chat la ve al instante.",
    };
  }

  private priorityOptionVM(value: number): QuickCapturePriorityOptionVM {
    const selected = this.priority === value;
    return {
      value,
      label: PRIORITY_LABELS[value],
      selected,
      className: selected ? this.selectedPriorityClass(value) : this.unselectedPriorityClass(),
    };
  }

  private selectedPriorityClass(value: number): string {
    if (value === 3) {
      return "translate-y-[-1px] border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]";
    }
    if (value === 2) {
      return "translate-y-[-1px] border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]";
    }
    return "translate-y-[-1px] border-[var(--divider)] bg-[var(--muted-bg)] text-[var(--foreground)]";
  }

  private unselectedPriorityClass(): string {
    return "border-transparent bg-[var(--hover-overlay)] text-[var(--muted)]";
  }

  private domainOptionVM(option: { value: string; label: string }): QuickCaptureDomainOptionVM {
    return option;
  }
}
