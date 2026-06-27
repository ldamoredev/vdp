import { ListTodo, Plus } from "lucide-react";
import { type FormEvent } from "react";

import { StateCard } from "@/ui/primitives/state-card";
import { TaskDomainBadge } from "@/ui/screens/tasks/components/task-domain-badge";
import { TaskPriorityBadge } from "@/ui/screens/tasks/components/task-priority-badge";
import type {
  BreakdownFormVM,
  BreakdownSuggestionVM,
  DetailProjectAssignmentVM,
  DetailTaskSelectorVM,
  DetailTaskSummaryVM,
  NoteFormVM,
  NoteListVM,
} from "@/ui/models/tasks/DetailPanelViewModel";
import { useDetailPanelPresenter } from "./useDetailPanelPresenter";

export function DetailPanel() {
  const presenter = useDetailPanelPresenter();
  const vm = presenter.model;

  return (
    <div aria-busy={vm.isLoading} className="glass-card-static scroll-mt-24 p-5">
      <div className="flex items-center gap-2">
        <ListTodo size={15} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">{vm.title}</h3>
      </div>

      {vm.selectedTask ? (
        <div className="mt-4 space-y-4">
          <TaskSummary vm={vm.selectedTask} />
          <TaskSelector vm={vm.selector} onOpenDetail={(id) => presenter.openDetail(id)} />
          <ProjectAssignment
            vm={vm.projectAssignment}
            onChange={(projectId) => void presenter.setProject(projectId)}
          />
          <BreakdownSuggestions
            suggestions={vm.breakdownSuggestions}
            onAddStep={(content) => void presenter.addSuggestedStep(content)}
          />
          <BreakdownStepForm
            vm={vm.breakdownForm}
            onChange={(value) => presenter.setBreakdownStep(value)}
            onAdd={() => void presenter.addBreakdownStep()}
          />
          <NoteList vm={vm.persistedSteps} />
          <NoteForm
            vm={vm.noteForm}
            onValueChange={(value) => presenter.setNoteValue(value)}
            onTypeChange={(type) => presenter.setNoteType(type)}
            onAdd={() => void presenter.addNote()}
          />
          <NoteList vm={vm.blockerNotes} />
          <NoteList vm={vm.contextNotes} />
        </div>
      ) : (
        vm.emptyState && (
          <div className="mt-4">
            <StateCard size="sm" description={vm.emptyState.description} />
          </div>
        )
      )}
    </div>
  );
}

function TaskSummary({ vm }: { vm: DetailTaskSummaryVM }) {
  return (
    <>
      <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              {vm.eyebrow}
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{vm.title}</div>
          </div>
          <span className="rounded-full border border-[var(--glass-border)] bg-white/40 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            {vm.statusLabel}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <TaskPriorityBadge priority={vm.priority} />
          <TaskDomainBadge domain={vm.domain} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{vm.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {vm.metrics.map((metric) => (
          <div key={metric.label} className={`rounded-[20px] border p-4 ${metric.className}`}>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              {metric.label}
            </div>
            <div className="mt-2 text-sm font-data font-medium text-[var(--foreground)]">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ProjectAssignment({
  vm,
  onChange,
}: {
  vm: DetailProjectAssignmentVM;
  onChange: (projectId: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {vm.label}
      </div>
      <select
        value={vm.projectId}
        onChange={(event) => onChange(event.target.value)}
        disabled={vm.disabled}
        className="glass-input w-full px-3 py-2 text-sm"
      >
        {vm.options.map((option) => (
          <option key={option.value || "none"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TaskSelector({
  vm,
  onOpenDetail,
}: {
  vm: DetailTaskSelectorVM;
  onOpenDetail: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {vm.label}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {vm.items.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onOpenDetail(task.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${task.className}`}
          >
            {task.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function BreakdownSuggestions({
  suggestions,
  onAddStep,
}: {
  suggestions: BreakdownSuggestionVM[];
  onAddStep: (content: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Pasos sugeridos
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.title}
            className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-3"
          >
            <div className="text-xs font-medium text-[var(--foreground)]">{suggestion.title}</div>
            <div className="mt-2 space-y-2">
              {suggestion.steps.map((step) => (
                <button
                  key={step.content}
                  type="button"
                  onClick={() => onAddStep(step.content)}
                  disabled={step.disabled}
                  className="block w-full rounded-xl border border-[var(--glass-border)] bg-white/40 px-3 py-2 text-left text-xs text-[var(--foreground)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {step.content}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownStepForm({
  vm,
  onChange,
  onAdd,
}: {
  vm: BreakdownFormVM;
  onChange: (value: string) => void;
  onAdd: () => void;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onAdd();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {vm.label}
      </div>
      <div className="flex gap-2">
        <input
          value={vm.value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={vm.placeholder}
          className="glass-input flex-1 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!vm.canAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          {vm.submitLabel}
        </button>
      </div>
    </form>
  );
}

function NoteForm({
  vm,
  onValueChange,
  onTypeChange,
  onAdd,
}: {
  vm: NoteFormVM;
  onValueChange: (value: string) => void;
  onTypeChange: (type: NoteFormVM["type"]) => void;
  onAdd: () => void;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onAdd();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {vm.label}
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={vm.type}
            onChange={(event) => onTypeChange(event.target.value as NoteFormVM["type"])}
            className="glass-input w-40 px-3 py-2 text-sm"
          >
            {vm.typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={vm.value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={vm.placeholder}
            className="glass-input flex-1 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!vm.canAdd}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          {vm.submitLabel}
        </button>
      </div>
    </form>
  );
}

function NoteList({ vm }: { vm: NoteListVM }) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {vm.title}
      </div>
      {vm.items.length > 0 ? (
        <div className="space-y-2">
          {vm.items.map((note) => (
            <div key={note.id} className={`rounded-2xl border px-3 py-3 text-sm ${note.className}`}>
              <div className="mb-2 inline-flex rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
                {note.label}
              </div>
              <div>{note.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <StateCard size="sm" description={vm.emptyMessage} />
      )}
    </div>
  );
}
