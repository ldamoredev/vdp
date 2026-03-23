import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { priorityLabel } from "@/lib/format";

interface QuickCaptureFormProps {
  newTitle: string;
  setNewTitle: (value: string) => void;
  newPriority: number;
  setNewPriority: (value: number) => void;
  newDomain: string;
  setNewDomain: (value: string) => void;
  domainOptions: { value: string; label: string }[];
  isCreatingTask: boolean;
  onSubmit: (event: FormEvent) => void;
}

export function QuickCaptureForm({
  newTitle,
  setNewTitle,
  newPriority,
  setNewPriority,
  newDomain,
  setNewDomain,
  domainOptions,
  isCreatingTask,
  onSubmit,
}: QuickCaptureFormProps) {
  return (
    <form onSubmit={onSubmit} className="glass-card-static p-6">
      <div className="flex items-center gap-2 text-[var(--foreground)]">
        <Plus size={16} style={{ color: "var(--violet-soft-text)" }} />
        <h3 className="text-sm font-medium">Captura rapida</h3>
      </div>

      <div className="mt-4">
        <textarea
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Agregar una tarea concreta para hoy..."
          rows={4}
          className="glass-input min-h-28 w-full resize-none px-4 py-3 text-sm leading-relaxed"
        />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Prioridad operativa
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setNewPriority(priority)}
                className={`rounded-2xl border px-3 py-2 text-xs font-medium transition-all ${
                  newPriority === priority
                    ? "translate-y-[-1px]"
                    : "border-transparent bg-[var(--hover-overlay)] text-[var(--muted)]"
                }`}
                style={
                  newPriority === priority
                    ? {
                        background:
                          priority === 3
                            ? "var(--red-soft-bg)"
                            : priority === 2
                              ? "var(--amber-soft-bg)"
                              : "var(--muted-bg)",
                        color:
                          priority === 3
                            ? "var(--red-soft-text)"
                            : priority === 2
                              ? "var(--amber-soft-text)"
                              : "var(--foreground)",
                        borderColor:
                          priority === 3
                            ? "var(--red-soft-border)"
                            : priority === 2
                              ? "var(--amber-soft-border)"
                              : "var(--divider)",
                      }
                    : undefined
                }
              >
                {priorityLabel(priority)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Dominio
          </div>
          <select
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="glass-input w-full px-3 py-2 text-sm"
          >
            {domainOptions.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={!newTitle.trim() || isCreatingTask}
        className="btn-primary mt-5 w-full justify-center"
      >
        <Plus size={16} />
        {isCreatingTask ? "Agregando..." : "Agregar a hoy"}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
        La tarea entra directo en la cola de ejecucion y el chat la ve al
        instante.
      </p>
    </form>
  );
}
