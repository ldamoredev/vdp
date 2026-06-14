import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { CreateTask } from "@/core/app/tasks/CreateTask";
import {
  analyzeTaskDraft,
  buildClarifiedDescription,
  CLARIFICATION_EXAMPLES,
  type TaskDraftAnalysis,
} from "@/core/domain/tasks/clarify";
import type {
  ClarificationGateVM,
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

const FALLBACK_PROMPTS = ["Que resultado concreto esperas?", "Cual es el siguiente paso visible?"];

/**
 * Dashboard quick capture. Owns the create-task draft and the clarification
 * gate: a too-vague title (analyzeTaskDraft, domain) opens the gate asking for
 * the expected outcome + next step before creating. On create, dispatches
 * CreateTask through the Core, then reloads and selects the task in the store.
 * The gate's Spanish copy is built here from the domain's boolean flags.
 */
export class QuickCapturePresenter extends PresenterBase<QuickCaptureViewModel> {
  private title = "";
  private priority = DEFAULT_PRIORITY;
  private domain = "";
  private isCreating = false;
  private errorMessage: string | null = null;
  private analysis: TaskDraftAnalysis | null = null;
  private gateOpen = false;
  private outcome = "";
  private nextStep = "";

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

  setOutcome(value: string): void {
    this.outcome = value;
    this.refresh();
  }

  setNextStep(value: string): void {
    this.nextStep = value;
    this.refresh();
  }

  /** Form submit: opens the clarification gate for a vague title, else creates. */
  async create(): Promise<void> {
    const title = this.title.trim();
    if (!title || this.isCreating) return;

    const analysis = analyzeTaskDraft(title);
    if (analysis.needsClarification) {
      this.analysis = analysis;
      this.gateOpen = true;
      this.refresh();
      return;
    }
    await this.submit({ withClarification: false });
  }

  /** Gate: create with the clarified outcome/next step folded into the description. */
  confirmClarified(): Promise<void> {
    return this.submit({ withClarification: true });
  }

  /** Gate: create as-is despite the warning. */
  createAnyway(): Promise<void> {
    return this.submit({ withClarification: false });
  }

  /** Gate: close it to keep editing the title. */
  dismissGate(): void {
    this.gateOpen = false;
    this.refresh();
  }

  /** Gate: adopt a concrete example as the title and close the gate. */
  useExample(example: string): void {
    this.title = example;
    this.gateOpen = false;
    this.analysis = null;
    this.refresh();
  }

  private async submit({ withClarification }: { withClarification: boolean }): Promise<void> {
    const title = this.title.trim();
    if (!title || this.isCreating) return;

    this.isCreating = true;
    this.errorMessage = null;
    this.refresh();

    try {
      const task = await this.core.execute(
        new CreateTask({
          title,
          description: withClarification
            ? buildClarifiedDescription(this.outcome, this.nextStep)
            : undefined,
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
    this.outcome = "";
    this.nextStep = "";
    this.gateOpen = false;
    this.analysis = null;
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
      gate: this.gateVM(),
    };
  }

  private gateVM(): ClarificationGateVM | null {
    if (!this.gateOpen || !this.analysis) return null;
    const prompts = this.prompts(this.analysis);
    return {
      heading: "Aclara la tarea antes de cargarla",
      reasons: this.reasons(this.analysis),
      outcome: this.outcome,
      nextStep: this.nextStep,
      outcomeLabel: "Resultado esperado",
      outcomePlaceholder: prompts[0] ?? "Que tiene que quedar resuelto?",
      nextStepLabel: "Siguiente paso concreto",
      nextStepPlaceholder: prompts[1] ?? "Cual es la siguiente accion visible?",
      examples: CLARIFICATION_EXAMPLES,
      canSaveClarified:
        (this.outcome.trim().length > 0 || this.nextStep.trim().length > 0) && !this.isCreating,
      saveLabel: this.isCreating ? "Guardando..." : "Guardar clarificada",
      keepEditingLabel: "Seguir editando",
      createAnywayLabel: "Crear igual",
    };
  }

  private reasons(analysis: TaskDraftAnalysis): string[] {
    const reasons: string[] = [];
    if (analysis.tooShort) {
      reasons.push("El titulo es demasiado corto para saber que accion concreta implica.");
    }
    if (analysis.genericStart) {
      reasons.push("La accion arranca con un verbo o etiqueta demasiado generica.");
    }
    return reasons;
  }

  private prompts(analysis: TaskDraftAnalysis): string[] {
    const prompts: string[] = [];
    if (analysis.needsOutcomePrompt) {
      prompts.push("Que tiene que quedar resuelto cuando esta tarea termine?");
    }
    if (analysis.needsNextStepPrompt) {
      prompts.push("Cual es el siguiente paso concreto que la vuelve ejecutable?");
    }
    return prompts.length > 0 ? prompts : FALLBACK_PROMPTS;
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
