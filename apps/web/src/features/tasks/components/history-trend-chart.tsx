import { BarChart3 } from "lucide-react";
import { useHistoryData } from "../use-history-context";

export function HistoryTrendChart() {
  const { trend, dateISO } = useHistoryData();

  if (!trend || trend.length === 0) return null;

  return (
    <section className="glass-card-static p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--violet-soft-bg)" }}>
          <BarChart3 size={15} style={{ color: "var(--violet-soft-text)" }} />
        </div>
        <div>
          <h3 className="font-medium text-sm">Tendencia 14 dias</h3>
          <p className="text-xs text-[var(--muted)]">Como viene cerrando tu ejecucion diaria</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {trend.slice().reverse().map((day) => (
          <div key={day.date} className="flex-1 text-center">
            <div className="mb-2 flex h-28 items-end justify-center">
              <div
                className="w-full max-w-[24px] rounded-t-lg transition-all"
                style={{
                  background:
                    day.date === dateISO
                      ? "linear-gradient(to top, var(--violet-soft-border), var(--violet-soft-text))"
                      : "linear-gradient(to top, var(--violet-soft-bg), var(--violet-soft-border))",
                  opacity: day.date === dateISO ? 1 : 0.7,
                  height: `${Math.max(4, day.completionRate)}%`,
                }}
              />
            </div>
            <div
              className={`text-[9px] ${day.date === dateISO ? "font-medium" : "text-[var(--muted)]"}`}
              style={day.date === dateISO ? { color: "var(--violet-soft-text)" } : undefined}
            >
              {day.date.slice(8)}
            </div>
            <div
              className="text-[9px] font-medium"
              style={day.date === dateISO ? { color: "var(--violet-soft-text)" } : undefined}
            >
              {day.completionRate}%
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
