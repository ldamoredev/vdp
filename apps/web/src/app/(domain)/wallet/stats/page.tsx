"use client";

import { useQuery } from "@tanstack/react-query";
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
import { ArrowRightLeft, BarChart3 } from "lucide-react";
import { walletApi } from "@/lib/api/wallet";
import { formatDate, formatMoney } from "@/lib/format";
import type { CategoryStat, ExchangeRate, MonthlyTrend } from "@/lib/api/types";

const COLORS = [
  "#3B82F6",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#A855F7",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

function monthLabel(month: string): string {
  return formatDate(`${month}-01`, "MMM yy");
}

function latestDollarRates(rates: ExchangeRate[]): ExchangeRate[] {
  return rates.filter((rate) => rate.fromCurrency === "USD" && rate.toCurrency === "ARS");
}

export default function StatsPage() {
  const { data: byCategory = [] } = useQuery<CategoryStat[]>({
    queryKey: ["wallet", "stats", "by-category"],
    queryFn: () => walletApi.getStatsByCategory(),
  });

  const { data: monthlyTrend = [] } = useQuery<MonthlyTrend[]>({
    queryKey: ["wallet", "stats", "monthly-trend"],
    queryFn: walletApi.getMonthlyTrend,
  });

  const { data: exchangeRates = [] } = useQuery<ExchangeRate[]>({
    queryKey: ["wallet", "exchange-rates", "latest"],
    queryFn: walletApi.getExchangeRates,
  });

  const dollarRates = latestDollarRates(exchangeRates);

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Estadisticas</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Tendencias, categorias y referencias cambiarias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-6">
        <div className="glass-card-static p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
              <BarChart3 size={15} className="text-[var(--accent)]" />
            </div>
            <h3 className="font-medium">Tendencia mensual</h3>
          </div>

          {monthlyTrend.length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <p className="text-[var(--muted)] text-sm">No hay datos suficientes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={monthlyTrend.map((item) => ({
                  ...item,
                  label: monthLabel(item.month),
                }))}
              >
                <XAxis
                  dataKey="label"
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
                    background: "rgba(15, 23, 42, 0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(148, 163, 184, 0.12)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    formatMoney(value, "ARS"),
                    name === "income" ? "Ingresos" : "Gastos",
                  ]}
                />
                <Bar dataKey="income" fill="#22C55E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card-static p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--blue-soft-bg)] text-[var(--blue-soft-text)] border border-[var(--blue-soft-border)] flex items-center justify-center">
              <ArrowRightLeft size={15} />
            </div>
            <h3 className="font-medium">Dolar hoy</h3>
          </div>

          {dollarRates.length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <p className="text-[var(--muted)] text-sm">No hay cotizaciones cargadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dollarRates.map((rate) => (
                <div
                  key={rate.id}
                  className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide">{rate.type}</p>
                      <p className="text-xs text-[var(--muted)]">{formatDate(rate.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatMoney(rate.rate, "ARS")}</p>
                      <p className="text-xs text-[var(--muted)]">por 1 USD</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card-static p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-purple)]/15 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-purple)]" />
          </div>
          <h3 className="font-medium">Gastos por categoria</h3>
        </div>

        {byCategory.length === 0 ? (
          <div className="h-72 flex items-center justify-center">
            <p className="text-[var(--muted)] text-sm">No hay datos suficientes</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-center">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="total"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={68}
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {byCategory.map((item, index) => (
                    <Cell key={item.categoryId ?? `uncategorized-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(148, 163, 184, 0.12)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => formatMoney(value, "ARS")}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {byCategory.map((item, index) => (
                <div
                  key={item.categoryId ?? `legend-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.categoryName}</p>
                      <p className="text-xs text-[var(--muted)]">{item.count} movimientos</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatMoney(item.total, "ARS")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
