import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatMoney } from "@/lib/format";

interface StatsSummaryProps {
  readonly stats: {
    readonly totalIncome?: string;
    readonly totalExpenses?: string;
    readonly netBalance?: string;
  };
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const income = Number(stats.totalIncome ?? 0);
  const expenses = Number(stats.totalExpenses ?? 0);
  const net = Number(stats.netBalance ?? 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
      <div className="glass-card-static p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--foreground-muted)]">
            Ingresos del mes
          </span>
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-green-glow)] flex items-center justify-center">
            <TrendingUp size={15} className="text-[var(--accent-green)]" />
          </div>
        </div>
        <div className="text-xl font-semibold text-[var(--accent-green)]">
          +{formatMoney(income, "ARS")}
        </div>
      </div>
      <div className="glass-card-static p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--foreground-muted)]">
            Gastos del mes
          </span>
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-red-glow)] flex items-center justify-center">
            <TrendingDown size={15} className="text-[var(--accent-red)]" />
          </div>
        </div>
        <div className="text-xl font-semibold text-[var(--accent-red)]">
          -{formatMoney(expenses, "ARS")}
        </div>
      </div>
      <div className="glass-card-static p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--foreground-muted)]">
            Neto
          </span>
          <div className="w-8 h-8 rounded-lg bg-[var(--hover-overlay)] flex items-center justify-center">
            <Minus size={15} className="text-[var(--foreground-muted)]" />
          </div>
        </div>
        <div className="text-xl font-semibold">
          {formatMoney(net, "ARS")}
        </div>
      </div>
    </div>
  );
}
