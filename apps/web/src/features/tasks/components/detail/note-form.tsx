import { Plus } from "lucide-react";
import type { TaskNote } from "@/lib/api/types";

interface NoteFormProps {
  taskId: string;
  noteValue: string;
  onNoteChange: (value: string) => void;
  noteType: TaskNote["type"];
  onNoteTypeChange: (type: TaskNote["type"]) => void;
  isAdding: boolean;
  onAdd: (input: { taskId: string; content: string; type: TaskNote["type"] }) => void;
}

export function NoteForm({
  taskId,
  noteValue,
  onNoteChange,
  noteType,
  onNoteTypeChange,
  isAdding,
  onAdd,
}: NoteFormProps) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Guardar nota
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={noteType}
            onChange={(e) =>
              onNoteTypeChange(e.target.value as TaskNote["type"])
            }
            className="glass-input w-40 px-3 py-2 text-sm"
          >
            <option value="note">Nota</option>
            <option value="blocker">Bloqueo</option>
          </select>
          <input
            value={noteValue}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={
              noteType === "blocker"
                ? "Ej: falta respuesta o recurso"
                : "Ej: contexto para retomarla rapido"
            }
            className="glass-input flex-1 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            onAdd({
              taskId,
              content: noteValue,
              type: noteType,
            })
          }
          disabled={!noteValue.trim() || isAdding}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          Guardar nota
        </button>
      </div>
    </div>
  );
}
