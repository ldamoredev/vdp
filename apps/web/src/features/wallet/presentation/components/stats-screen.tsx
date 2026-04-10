"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { ModulePage } from "@/components/primitives/module-page";
import { StateCard } from "@/components/primitives/state-card";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatMoney } from "@/lib/format";
import { useWalletData } from "../use-wallet-context";
import { SanityStrip } from "../sanity-strip/sanity-strip";
import { buildWalletScreenIntro } from "../wallet-polish-selectors";

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

function monthLabel(month: string) {
  return formatDate(`${month}-01`, "MMM yy");
}

export function StatsScreen() {
  const {
    byCategory,
    monthlyTrend,
    dollarRates,
    isLoadingByCategory,
    isLoadingMonthlyTrend,
    isLoadingExchangeRates,
  } = useWalletData();
  const categoryCount = byCategory.reduce((sum, item) => sum + item.count, 0);
  const categoryTotal = byCategory.reduce((sum, item) => sum + item.total, 0);

  return (
    <ModulePage width="5xl" spacing="6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Estadisticas</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {buildWalletScreenIntro("stats")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="glass-card-static p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-glow)]">
              <BarChart3 size={15} className="text-[var(--accent)]" />
            </div>
            <h3 className="font-medium">Tendencia mensual</h3>
          </div>

          {isLoadingMonthlyTrend ? (
            <div className="flex h-72 items-center justify-center">
              <StateCard size="sm" description="Cargando..." />
            </div>
          ) : monthlyTrend.length === 0 ? (
            <div className="flex h-72 items-center justify-center">
              <StateCard size="sm" description="No hay datos suficientes" />
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
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--blue-soft-border)] bg-[var(--blue-soft-bg)] text-[var(--blue-soft-text)]">
              <ArrowRightLeft size={15} />
            </div>
            <h3 className="font-medium">Dolar hoy</h3>
          </div>

          {isLoadingExchangeRates ? (
            <div className="flex h-72 items-center justify-center">
              <StateCard size="sm" description="Cargando..." />
            </div>
          ) : dollarRates.length === 0 ? (
            <div className="flex h-72 items-center justify-center">
              <StateCard size="sm" description="No hay cotizaciones cargadas" />
            </div>
          ) : (
            <div className="space-y-3">
              {dollarRates.map((rate) => (
                <div
                  key={rate.id}
                  className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-wide">
                        {rate.type}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatDate(rate.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tracking-tight">
                        {formatMoney(rate.rate, "ARS")}
                      </p>
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
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-purple)]/15">
              <div className="h-3 w-3 rounded-full bg-[var(--accent-purple)]" />
            </div>
            <h3 className="font-medium">Gastos por categoria</h3>
          </div>
          <SanityStrip
            transactionCount={categoryCount}
            totalAmount={formatMoney(categoryTotal, "ARS")}
          />
        </div>

        {isLoadingByCategory ? (
          <div className="flex h-72 items-center justify-center">
            <StateCard size="sm" description="Cargando..." />
          </div>
        ) : byCategory.length === 0 ? (
          <div className="flex h-72 items-center justify-center">
            <StateCard size="sm" description="No hay datos suficientes" />
          </div>
        ) : (
          <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
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
                    <Cell
                      key={item.categoryId ?? `uncategorized-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
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
                item.categoryId ? (
                <Link
                  key={item.categoryId ?? `legend-${index}`}
                  href={`/wallet/transactions?type=expense&categoryId=${item.categoryId}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-4 transition-all hover:shadow-sm hover:ring-1 hover:ring-[var(--glass-border)]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {item.categoryName}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {item.count} movimientos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(item.total, "ARS")}
                    </p>
                    <ChevronRight size={14} className="text-[var(--muted)]" />
                  </div>
                </Link>
                ) : (
                  <div
                    key={item.categoryId ?? `legend-${index}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          background: COLORS[index % COLORS.length],
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {item.categoryName}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {item.count} movimientos
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(item.total, "ARS")}
                    </p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </ModulePage>
  );
}
