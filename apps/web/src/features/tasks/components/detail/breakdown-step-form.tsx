import { Plus } from "lucide-react";

interface BreakdownStepFormProps {
  taskId: string;
  value: string;
  onChange: (value: string) => void;
  isAdding: boolean;
  onAdd: (input: { taskId: string; content: string; type: "breakdown_step" }) => void;
}

export function BreakdownStepForm({
  taskId,
  value,
  onChange,
  isAdding,
  onAdd,
}: BreakdownStepFormProps) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Agregar siguiente paso
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej: abrir documento y definir entregable"
          className="glass-input flex-1 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() =>
            onAdd({
              taskId,
              content: value,
              type: "breakdown_step",
            })
          }
          disabled={!value.trim() || isAdding}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          Agregar
        </button>
      </div>
    </div>
  );
}
