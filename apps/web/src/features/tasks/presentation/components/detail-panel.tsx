import { ListTodo } from "lucide-react";
import { useTasksData, useTasksActions } from "../use-tasks-context";
import { TaskSummary } from "./detail/task-summary";
import { TaskSelector } from "./detail/task-selector";
import { BreakdownSuggestions } from "./detail/breakdown-suggestions";
import { BreakdownStepForm } from "./detail/breakdown-step-form";
import { PersistedSteps } from "./detail/persisted-steps";
import { NoteForm } from "./detail/note-form";
import { NoteList } from "./detail/note-list";

export function DetailPanel() {
  const {
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
    newTaskNote,
    newTaskNoteType,
    isAddingTaskNote,
  } = useTasksData();
  const {
    openBreakdownStudio,
    setNewBreakdownStep,
    setNewTaskNote,
    setNewTaskNoteType,
    addTaskNote,
  } = useTasksActions();

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
          <TaskSummary task={selectedTask} notesCount={selectedTaskNotes.length} />

          <TaskSelector
            pendingTasks={pendingTasks}
            activeSelectedTaskId={activeSelectedTaskId}
            onOpenDetail={openBreakdownStudio}
          />

          <BreakdownSuggestions
            suggestions={breakdownSuggestions}
            taskId={selectedTask.id}
            isAddingNote={isAddingTaskNote}
            onAddStep={addTaskNote}
          />

          <BreakdownStepForm
            taskId={selectedTask.id}
            value={newBreakdownStep}
            onChange={setNewBreakdownStep}
            isAdding={isAddingTaskNote}
            onAdd={addTaskNote}
          />

          <PersistedSteps steps={persistedSteps} />

          <NoteForm
            taskId={selectedTask.id}
            noteValue={newTaskNote}
            onNoteChange={setNewTaskNote}
            noteType={newTaskNoteType}
            onNoteTypeChange={setNewTaskNoteType}
            isAdding={isAddingTaskNote}
            onAdd={addTaskNote}
          />

          <NoteList
            title="Bloqueos"
            notes={blockerNotes}
            emptyMessage="Sin bloqueos registrados."
          />

          <NoteList
            title="Notas y contexto"
            notes={contextNotes}
            emptyMessage="Todavia no hay notas de contexto para esta tarea."
          />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          Selecciona una tarea pendiente para ver su detalle.
        </div>
      )}
    </div>
  );
}
