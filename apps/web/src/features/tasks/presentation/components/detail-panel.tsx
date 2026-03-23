import { ListTodo, Plus } from "lucide-react";
import type { Task, TaskNote } from "@/lib/api/types";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskDomainBadge } from "@/components/tasks/task-domain-badge";
import { formatTaskDate, noteTypeLabel, noteTypeTone } from "../tasks-dashboard-selectors";
import type { RefObject } from "react";

interface BreakdownSuggestion {
  title: string;
  steps: string[];
}

interface DetailPanelProps {
  breakdownStudioRef: RefObject<HTMLDivElement | null>;
  selectedTask: Task | undefined;
  selectedTaskNotes: TaskNote[];
  pendingTasks: Task[];
  activeSelectedTaskId: string | undefined;
  breakdownSuggestions: BreakdownSuggestion[];
  persistedSteps: TaskNote[];
  blockerNotes: TaskNote[];
  contextNotes: TaskNote[];
  newBreakdownStep: string;
  setNewBreakdownStep: (value: string) => void;
  newTaskNote: string;
  setNewTaskNote: (value: string) => void;
  newTaskNoteType: TaskNote["type"];
  setNewTaskNoteType: (value: TaskNote["type"]) => void;
  isAddingTaskNote: boolean;
  onOpenDetail: (id: string) => void;
  onAddNote: (input: { taskId: string; content: string; type: TaskNote["type"] }) => void;
}

export function DetailPanel({
  breakdownStudioRef,
  selectedTask,
  selectedTaskNotes,
  pendingTasks,
  activeSelectedTaskId,
  breakdownSuggestions,
  persistedSteps,
  blockerNotes,
  contextNotes,
  newBreakdownStep,
  setNewBreakdownStep,
  newTaskNote,
  setNewTaskNote,
  newTaskNoteType,
  setNewTaskNoteType,
  isAddingTaskNote,
  onOpenDetail,
  onAddNote,
}: DetailPanelProps) {
  return (
    <div ref={breakdownStudioRef} className="glass-card-static p-5 scroll-mt-24">
      <div className="flex items-center gap-2">
        <ListTodo size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">
          Panel de detalle
        </h3>
      </div>

      {selectedTask ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Tarea seleccionada
                </div>
                <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                  {selectedTask.title}
                </div>
              </div>
              <span className="rounded-full border border-[var(--glass-border)] bg-white/40 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                {selectedTask.status === "done" ? "Hecha" : "Activa"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <TaskPriorityBadge priority={selectedTask.priority} />
              <TaskDomainBadge domain={selectedTask.domain} />
            </div>
            {selectedTask.description ? (
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {selectedTask.description}
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                Sin descripcion adicional. Si necesitas preservar contexto
                para retomarla mejor, guardalo como nota.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Fecha
              </div>
              <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {formatTaskDate(selectedTask.scheduledDate)}
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Carry-over
              </div>
              <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {selectedTask.carryOverCount}
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Notas
              </div>
              <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                {selectedTaskNotes.length}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Elegir tarea
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {pendingTasks.slice(0, 6).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpenDetail(task.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    task.id === activeSelectedTaskId
                      ? "bg-[var(--accent)] text-white shadow-lg"
                      : "bg-[var(--hover-overlay)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {task.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Pasos sugeridos
            </div>
            <div className="space-y-2">
              {breakdownSuggestions.map((suggestion) => (
                <div
                  key={suggestion.title}
                  className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3"
                >
                  <div className="text-xs font-medium text-[var(--foreground)]">
                    {suggestion.title}
                  </div>
                  <div className="mt-2 space-y-2">
                    {suggestion.steps.map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() =>
                          onAddNote({
                            taskId: selectedTask.id,
                            content: step,
                            type: "breakdown_step",
                          })
                        }
                        disabled={isAddingTaskNote}
                        className="block w-full rounded-xl border border-[var(--glass-border)] bg-white/40 px-3 py-2 text-left text-xs text-[var(--foreground)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Agregar siguiente paso
            </div>
            <div className="flex gap-2">
              <input
                value={newBreakdownStep}
                onChange={(e) => setNewBreakdownStep(e.target.value)}
                placeholder="Ej: abrir documento y definir entregable"
                className="glass-input flex-1 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  onAddNote({
                    taskId: selectedTask.id,
                    content: newBreakdownStep,
                    type: "breakdown_step",
                  })
                }
                disabled={!newBreakdownStep.trim() || isAddingTaskNote}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />
                Agregar
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Pasos persistidos
            </div>
            {persistedSteps.length > 0 ? (
              <div className="space-y-2">
                {persistedSteps.map((note: TaskNote) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] px-3 py-3 text-sm text-[var(--foreground)]"
                  >
                    <div className="mb-2 inline-flex rounded-full border border-[var(--violet-soft-border)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--violet-soft-text)]">
                      Paso
                    </div>
                    <div>{note.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-6 text-center text-xs text-[var(--muted)]">
                Todavia no hay pasos guardados para esta tarea.
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Guardar nota
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={newTaskNoteType}
                  onChange={(e) =>
                    setNewTaskNoteType(e.target.value as TaskNote["type"])
                  }
                  className="glass-input w-40 px-3 py-2 text-sm"
                >
                  <option value="note">Nota</option>
                  <option value="blocker">Bloqueo</option>
                </select>
                <input
                  value={newTaskNote}
                  onChange={(e) => setNewTaskNote(e.target.value)}
                  placeholder={
                    newTaskNoteType === "blocker"
                      ? "Ej: falta respuesta o recurso"
                      : "Ej: contexto para retomarla rapido"
                  }
                  className="glass-input flex-1 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onAddNote({
                    taskId: selectedTask.id,
                    content: newTaskNote,
                    type: newTaskNoteType,
                  })
                }
                disabled={!newTaskNote.trim() || isAddingTaskNote}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />
                Guardar nota
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Bloqueos
            </div>
            {blockerNotes.length > 0 ? (
              <div className="space-y-2">
                {blockerNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-2xl border px-3 py-3 text-sm ${noteTypeTone(note.type)}`}
                  >
                    <div className="mb-2 inline-flex rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
                      {noteTypeLabel(note.type)}
                    </div>
                    <div>{note.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-6 text-center text-xs text-[var(--muted)]">
                Sin bloqueos registrados.
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              Notas y contexto
            </div>
            {contextNotes.length > 0 ? (
              <div className="space-y-2">
                {contextNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-2xl border px-3 py-3 text-sm ${noteTypeTone(note.type)}`}
                  >
                    <div className="mb-2 inline-flex rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
                      {noteTypeLabel(note.type)}
                    </div>
                    <div>{note.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-6 text-center text-xs text-[var(--muted)]">
                Todavia no hay notas de contexto para esta tarea.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          Selecciona una tarea pendiente para ver su detalle.
        </div>
      )}
    </div>
  );
}
