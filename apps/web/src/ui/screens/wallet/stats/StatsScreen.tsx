import { ArrowRightLeft, BarChart3, ChevronRight } from "lucide-react";
import { Link } from "react-router";
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

import { ModulePage } from "@/ui/primitives/module-page";
import { StateCard } from "@/ui/primitives/state-card";
import { formatMoney } from "@/lib/format";
import type {
  ByCategoryVM,
  CategorySliceVM,
  DollarRatesVM,
  MonthlyTrendVM,
} from "@/ui/models/wallet/StatsViewModel";
import { SanityStrip } from "../components/sanity-strip";
import { useStatsPresenter } from "./useStatsPresenter";

const TOOLTIP_STYLE = {
  background: "rgba(15, 23, 42, 0.92)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(148, 163, 184, 0.12)",
  borderRadius: "12px",
  fontSize: "12px",
} as const;

export function StatsScreen() {
  const presenter = useStatsPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="5xl" spacing="6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">{vm.title}</h2>
        <p className="max-w-2xl text-sm text-[var(--muted)] sm:text-right">{vm.intro}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <MonthlyTrendPanel vm={vm.monthlyTrend} />
        <DollarRatesPanel vm={vm.dollarRates} />
      </div>

      <ByCategoryPanel vm={vm.byCategory} />
    </ModulePage>
  );
}

function MonthlyTrendPanel({ vm }: { vm: MonthlyTrendVM }) {
  return (
    <div className="glass-card-static p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-glow)]">
          <BarChart3 size={15} className="text-[var(--accent)]" />
        </div>
        <h3 className="font-medium">Tendencia mensual</h3>
      </div>

      {vm.isLoading ? (
        <ChartPlaceholder description="Cargando..." />
      ) : vm.isEmpty ? (
        <ChartPlaceholder description="No hay datos suficientes" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={vm.bars}>
            <XAxis
              dataKey="label"
              stroke="var(--muted)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "var(--glass-border)" }}
            />
            <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
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
  );
}

function DollarRatesPanel({ vm }: { vm: DollarRatesVM }) {
  return (
    <div className="glass-card-static p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--blue-soft-border)] bg-[var(--blue-soft-bg)] text-[var(--blue-soft-text)]">
          <ArrowRightLeft size={15} />
        </div>
        <h3 className="font-medium">Dolar hoy</h3>
      </div>

      {vm.isLoading ? (
        <ChartPlaceholder description="Cargando..." />
      ) : vm.isEmpty ? (
        <ChartPlaceholder description="No hay cotizaciones cargadas" />
      ) : (
        <div className="space-y-3">
          {vm.items.map((rate) => (
            <div
              key={rate.id}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide">{rate.typeLabel}</p>
                  <p className="text-xs text-[var(--muted)]">{rate.dateLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tracking-tight">{rate.rateLabel}</p>
                  <p className="text-xs text-[var(--muted)]">por 1 USD</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ByCategoryPanel({ vm }: { vm: ByCategoryVM }) {
  return (
    <div className="glass-card-static p-5">
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-purple)]/15">
            <div className="h-3 w-3 rounded-full bg-[var(--accent-purple)]" />
          </div>
          <h3 className="font-medium">Gastos por categoria</h3>
        </div>
        <SanityStrip transactionCount={vm.sanity.transactionCount} totalAmount={vm.sanity.totalLabel} />
      </div>

      {vm.isLoading ? (
        <ChartPlaceholder description="Cargando..." />
      ) : vm.isEmpty ? (
        <ChartPlaceholder description="No hay datos suficientes" />
      ) : (
        <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={vm.slices}
                dataKey="totalValue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={68}
                strokeWidth={0}
                paddingAngle={2}
              >
                {vm.slices.map((slice) => (
                  <Cell key={slice.key} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => formatMoney(value, "ARS")} />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {vm.slices.map((slice) => (
              <CategoryLegendRow key={slice.key} vm={slice} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryLegendRow({ vm }: { vm: CategorySliceVM }) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full" style={{ background: vm.color }} />
        <div>
          <p className="text-sm font-medium">{vm.name}</p>
          <p className="text-xs text-[var(--muted)]">{vm.movementsLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold tabular-nums">{vm.totalLabel}</p>
        {vm.href && <ChevronRight size={14} className="text-[var(--muted)]" />}
      </div>
    </>
  );

  if (vm.href) {
    return (
      <Link
        to={vm.href}
        className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-4 transition-all hover:shadow-sm hover:ring-1 hover:ring-[var(--glass-border)]"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-4">
      {content}
    </div>
  );
}

function ChartPlaceholder({ description }: { description: string }) {
  return (
    <div className="flex h-72 items-center justify-center">
      <StateCard size="sm" description={description} />
    </div>
  );
}
