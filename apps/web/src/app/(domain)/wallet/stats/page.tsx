"use client";

import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/lib/api/wallet";
import { formatMoney } from "@/lib/format";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#A855F7",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

export default function StatsPage() {
  const { data: byCategory = [] } = useQuery({
    queryKey: ["stats", "by-category"],
    queryFn: () => walletApi.getStatsByCategory(),
  });

  const { data: monthlyTrend = [] } = useQuery({
    queryKey: ["stats", "monthly-trend"],
    queryFn: walletApi.getMonthlyTrend,
  });

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Estadisticas</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Analisis de tus finanzas
        </p>
      </div>

      {/* Monthly Trend */}
      <div className="glass-card-static p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
            <BarChart3 size={15} className="text-[var(--accent)]" />
          </div>
          <h3 className="font-medium">Tendencia mensual</h3>
        </div>
        {monthlyTrend.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-[var(--muted)] text-sm">
              No hay datos suficientes
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrend}>
              <XAxis
                dataKey="month"
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "var(--glass-border)" }}
              />
              <YAxis
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
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
              <Bar
                dataKey="income"
                fill="#22C55E"
                name="Ingresos"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="expense"
                fill="#EF4444"
                name="Gastos"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Spending by Category */}
      <div className="glass-card-static p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-purple)]/15 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-purple)]" />
          </div>
          <h3 className="font-medium">Gastos por categoria</h3>
        </div>
        {byCategory.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-[var(--muted)] text-sm">
              No hay datos suficientes
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={300}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={65}
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {byCategory.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.9)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {byCategory.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between group cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm font-medium group-hover:text-[var(--foreground)] transition-colors">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-sm tabular-nums text-[var(--foreground-muted)]">
                    {formatMoney(item.total, "ARS")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
