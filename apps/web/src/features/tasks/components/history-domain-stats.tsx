import { PieChart } from "lucide-react";
import { domainBadge, domainLabel } from "@/lib/format";
import { useHistoryData } from "../use-history-context";

export function HistoryDomainStats() {
  const { domainStats } = useHistoryData();

  if (!domainStats || domainStats.length === 0) return null;

  return (
    <section className="glass-card-static p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--violet-soft-bg)" }}>
          <PieChart size={15} style={{ color: "var(--violet-soft-text)" }} />
        </div>
        <div>
          <h3 className="font-medium text-sm">Por dominio</h3>
          <p className="text-xs text-[var(--muted)]">Distribucion de cierres completados</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {domainStats.map((stat) => (
          <div key={stat.domain || "none"} className="glass-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className={`badge text-[10px] ${domainBadge(stat.domain)}`}>
                {domainLabel(stat.domain) || "Sin dominio"}
              </span>
            </div>
            <div className="text-lg font-bold text-[var(--foreground)]">
              {stat.completed}
            </div>
            <div className="text-[10px] text-[var(--muted)]">
              de {stat.total} tareas
            </div>
            <div className="progress-bar mt-2">
              <div
                className="progress-bar-fill green"
                style={{
                  width: `${stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
