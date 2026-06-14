import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { AddTaskNote } from "@/core/app/tasks/AddTaskNote";
import { GetTask } from "@/core/app/tasks/GetTask";
import { ListTaskNotes } from "@/core/app/tasks/ListTaskNotes";
import { buildPlanningSignal } from "@/core/domain/tasks/PlanningSignal";
import type { Task } from "@/core/domain/tasks/Task";
import type { TaskNote, TaskNoteType } from "@/core/domain/tasks/TaskNote";
import { formatTaskDate } from "@/lib/format";
import type {
  BreakdownSuggestionVM,
  DetailPanelViewModel,
  DetailTaskSelectorItemVM,
  DetailTaskSummaryVM,
  NoteItemVM,
} from "@/ui/models/tasks/DetailPanelViewModel";
import type { TasksDashboardStore } from "../TasksDashboardStore";

const DEFAULT_NOTE_TYPE: TaskNoteType = "note";

export class DetailPanelPresenter extends PresenterBase<DetailPanelViewModel> {
  private selectedTask: Task | null = null;
  private notes: TaskNote[] = [];
  private lastLoadedTaskId: string | undefined;
  private breakdownStep = "";
  private noteValue = "";
  private noteType: TaskNoteType = DEFAULT_NOTE_TYPE;
  private isLoading = false;
  private isAddingNote = false;

  constructor(
    onChange: ChangeFunc,
    private readonly store: TasksDashboardStore,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): DetailPanelViewModel {
    return this.buildModel();
  }

  start(): void {
    this.store.tasks$.subscribe(this, () => this.handleStoreChanged());
    this.store.selectedId$.subscribe(this, () => this.handleStoreChanged());
    this.handleStoreChanged();
  }

  stop(): void {
    this.store.tasks$.unsubscribe(this);
    this.store.selectedId$.unsubscribe(this);
  }

  openDetail(id: string): void {
    this.store.select(id);
  }

  setBreakdownStep(value: string): void {
    this.breakdownStep = value;
    this.refresh();
  }

  async addBreakdownStep(): Promise<void> {
    await this.addTaskNote(this.normalizeBreakdownStep(this.breakdownStep), "breakdown_step", () => {
      this.breakdownStep = "";
    });
  }

  async addSuggestedStep(content: string): Promise<void> {
    await this.addTaskNote(content, "breakdown_step");
  }

  setNoteValue(value: string): void {
    this.noteValue = value;
    this.refresh();
  }

  setNoteType(type: TaskNoteType): void {
    this.noteType = type;
    this.refresh();
  }

  async addNote(): Promise<void> {
    await this.addTaskNote(this.noteValue.trim(), this.noteType, () => {
      this.noteValue = "";
      this.noteType = DEFAULT_NOTE_TYPE;
    });
  }

  private handleStoreChanged(): void {
    this.ensureSelection();
    const taskId = this.store.selectedId$.value;
    this.refresh();
    if (taskId && taskId !== this.lastLoadedTaskId) {
      void this.loadDetail(taskId);
    }
  }

  private ensureSelection(): void {
    const tasks = this.store.tasks$.value;
    if (tasks.length === 0) {
      if (this.store.selectedId$.value) this.store.select(undefined);
      this.selectedTask = null;
      this.notes = [];
      this.lastLoadedTaskId = undefined;
      return;
    }

    const selectedId = this.store.selectedId$.value;
    if (selectedId && tasks.some((task) => task.id === selectedId)) return;

    const defaultTask = buildPlanningSignal({ tasks }).focusTasks[0] ?? tasks.find((task) => task.isPending);
    this.store.select(defaultTask?.id);
  }

  private async loadDetail(taskId: string): Promise<void> {
    this.lastLoadedTaskId = taskId;
    this.isLoading = true;
    this.refresh();
    try {
      const details = await this.core.execute(new GetTask(taskId));
      this.selectedTask = details.task;
      try {
        this.notes = await this.core.execute(new ListTaskNotes(taskId));
      } catch {
        this.notes = details.notes;
      }
    } catch {
      this.selectedTask = this.store.tasks$.value.find((task) => task.id === taskId) ?? null;
      this.notes = [];
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private async reloadNotes(): Promise<void> {
    const taskId = this.store.selectedId$.value;
    if (!taskId) return;
    try {
      this.notes = await this.core.execute(new ListTaskNotes(taskId));
    } catch {
      // keep last known notes
    } finally {
      this.refresh();
    }
  }

  private async addTaskNote(content: string, type: TaskNoteType, onSuccess?: () => void): Promise<void> {
    const taskId = this.store.selectedId$.value;
    const normalized = content.trim();
    if (!taskId || !normalized || this.isAddingNote) return;

    this.isAddingNote = true;
    this.refresh();
    try {
      await this.core.execute(new AddTaskNote(taskId, normalized, type));
      onSuccess?.();
      await this.reloadNotes();
    } finally {
      this.isAddingNote = false;
      this.refresh();
    }
  }

  private normalizeBreakdownStep(step: string): string {
    const trimmed = step.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("- ") ? trimmed : `- ${trimmed}`;
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): DetailPanelViewModel {
    const activeTask = this.activeTask();
    const selectedTask = activeTask ? this.summaryVM(activeTask) : null;
    const notes = this.notesForActiveTask();

    return {
      title: "Panel de detalle",
      selectedTask,
      selector: {
        label: "Elegir tarea",
        items: this.selectorItems(),
      },
      breakdownSuggestions: activeTask ? this.breakdownSuggestions(activeTask) : [],
      breakdownForm: {
        label: "Agregar siguiente paso",
        value: this.breakdownStep,
        placeholder: "Ej: abrir documento y definir entregable",
        canAdd: Boolean(this.breakdownStep.trim()) && !this.isAddingNote && Boolean(activeTask),
        isAdding: this.isAddingNote,
        submitLabel: "Agregar",
      },
      persistedSteps: {
        title: "Pasos persistidos",
        items: notes.filter((note) => note.type === "breakdown_step").map((note) => this.noteItemVM(note)),
        emptyMessage: "Todavia no hay pasos guardados para esta tarea.",
      },
      noteForm: {
        label: "Guardar nota",
        value: this.noteValue,
        type: this.noteType,
        typeOptions: [
          { value: "note", label: "Nota" },
          { value: "blocker", label: "Bloqueo" },
        ],
        placeholder:
          this.noteType === "blocker"
            ? "Ej: falta respuesta o recurso"
            : "Ej: contexto para retomarla rapido",
        canAdd: Boolean(this.noteValue.trim()) && !this.isAddingNote && Boolean(activeTask),
        isAdding: this.isAddingNote,
        submitLabel: "Guardar nota",
      },
      blockerNotes: {
        title: "Bloqueos",
        items: notes.filter((note) => note.type === "blocker").map((note) => this.noteItemVM(note)),
        emptyMessage: "Sin bloqueos registrados.",
      },
      contextNotes: {
        title: "Notas y contexto",
        items: notes.filter((note) => note.type === "note").map((note) => this.noteItemVM(note)),
        emptyMessage: "Todavia no hay notas de contexto para esta tarea.",
      },
      emptyState: activeTask ? null : { description: "Selecciona una tarea pendiente para ver su detalle." },
      isLoading: this.isLoading,
    };
  }

  private activeTask(): Task | null {
    const selectedId = this.store.selectedId$.value;
    if (!selectedId) return null;
    const storeTask = this.store.tasks$.value.find((task) => task.id === selectedId) ?? null;
    if (this.selectedTask?.id !== selectedId) return storeTask;
    if (storeTask && storeTask.updatedAt !== this.selectedTask.updatedAt) return storeTask;
    return this.selectedTask ?? storeTask;
  }

  private notesForActiveTask(): TaskNote[] {
    const selectedId = this.store.selectedId$.value;
    return this.notes.filter((note) => note.taskId === selectedId);
  }

  private summaryVM(task: Task): DetailTaskSummaryVM {
    return {
      id: task.id,
      eyebrow: "Tarea seleccionada",
      title: task.title,
      statusLabel: this.statusLabel(task),
      description:
        task.description ??
        "Sin descripcion adicional. Si necesitas preservar contexto para retomarla mejor, guardalo como nota.",
      priority: task.priority,
      domain: task.domain,
      metrics: [
        { label: "Fecha", value: formatTaskDate(task.scheduledDate), className: "border-[var(--glass-border)] bg-[var(--hover-overlay)]" },
        { label: "Carry-over", value: String(task.carryOverCount), className: "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]" },
        { label: "Notas", value: String(this.notesForActiveTask().length), className: "border-[var(--glass-border)] bg-[var(--hover-overlay)]" },
      ],
    };
  }

  private statusLabel(task: Task): string {
    if (task.isDone) return "Hecha";
    if (task.status === "discarded") return "Descartada";
    return "Activa";
  }

  private selectorItems(): DetailTaskSelectorItemVM[] {
    const selectedId = this.store.selectedId$.value;
    return this.store.tasks$.value
      .filter((task) => task.isPending)
      .slice(0, 6)
      .map((task) => ({
        id: task.id,
        title: task.title,
        selected: task.id === selectedId,
        className:
          task.id === selectedId
            ? "bg-[var(--accent)] text-white shadow-lg"
            : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]",
      }));
  }

  private breakdownSuggestions(task: Task): BreakdownSuggestionVM[] {
    const title = task.title.trim().replace(/\s+/g, " ");
    const base = title.charAt(0).toLowerCase() + title.slice(1);

    return [
      {
        title: "Aclarar salida",
        steps: [
          `Definir que significa terminar: ${base}`,
          "Anotar el entregable o resultado exacto en una frase",
        ].map((content) => ({ content, disabled: this.isAddingNote })),
      },
      {
        title: "Primer empuje",
        steps: [
          `Identificar el primer paso fisico para avanzar con: ${base}`,
          "Bloquear 25 minutos solo para ese primer paso",
        ].map((content) => ({ content, disabled: this.isAddingNote })),
      },
      {
        title: task.carryOverCount > 0 ? "Destrabar carry-over" : "Reducir friccion",
        steps: [
          task.carryOverCount > 0
            ? "Escribir por que se arrastro y que impide cerrarla"
            : "Separar la parte facil de la parte incierta",
          "Elegir una accion que deje evidencia visible de avance hoy",
        ].map((content) => ({ content, disabled: this.isAddingNote })),
      },
    ];
  }

  private noteItemVM(note: TaskNote): NoteItemVM {
    return {
      id: note.id,
      content: note.content,
      label: this.noteTypeLabel(note.type),
      className: this.noteTypeClassName(note.type),
    };
  }

  private noteTypeLabel(type: TaskNoteType): string {
    if (type === "breakdown_step") return "Paso";
    if (type === "blocker") return "Bloqueo";
    return "Nota";
  }

  private noteTypeClassName(type: TaskNoteType): string {
    if (type === "breakdown_step") {
      return "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--foreground)]";
    }
    if (type === "blocker") {
      return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]";
    }
    return "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--foreground)]";
  }
}
