import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { metricConfig } from "./config";

interface WeeklyChartProps {
  weeklyStats: any[] | undefined;
}

export function WeeklyChart({ weeklyStats }: WeeklyChartProps) {
  const weeklyChartData = weeklyStats?.map((s: any) => ({
    type: metricConfig[s.metricType]?.label || s.metricType,
    avg: parseFloat(s.avg),
    count: s.count,
  })) || [];

  return (
    <div className="lg:col-span-2 glass-card-static p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--emerald-soft-bg)" }}>
          <TrendingUp size={15} style={{ color: "var(--emerald-soft-text)" }} />
        </div>
        <div>
          <h3 className="font-medium">Resumen semanal</h3>
          <p className="text-xs text-[var(--muted)]">Promedio de los ultimos 7 dias</p>
        </div>
      </div>
      {weeklyChartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={weeklyChartData}>
            <XAxis dataKey="type" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--glass-border)" }} />
            <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 23, 42, 0.9)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              }}
              cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
            />
            <Bar dataKey="avg" fill="#10B981" name="Promedio" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[240px] text-sm text-[var(--muted)]">
          No hay datos de la ultima semana
        </div>
      )}
    </div>
  );
}
