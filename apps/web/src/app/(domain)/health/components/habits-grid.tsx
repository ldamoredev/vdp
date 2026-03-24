import { Activity } from "lucide-react";

interface HabitsGridProps {
  habits: any[];
}

export function HabitsGrid({ habits }: HabitsGridProps) {
  if (habits.length === 0) return null;

  return (
    <div className="glass-card-static p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--purple-soft-bg)" }}>
          <Activity size={15} style={{ color: "var(--purple-soft-text)" }} />
        </div>
        <h3 className="font-medium">Habitos activos</h3>
        <span className="text-xs text-[var(--muted)]">{habits.length} habitos</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {habits.slice(0, 8).map((h: any) => (
          <div key={h.id} className="glass-card p-3 text-center">
            <div className="text-lg mb-1">{h.icon || "📋"}</div>
            <div className="text-sm font-medium truncate">{h.name}</div>
            <div className="text-xs text-[var(--muted)]">{h.frequency}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
