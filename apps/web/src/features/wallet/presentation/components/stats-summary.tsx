import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { WalletStatsSummary } from "@/lib/api/types";

export function StatsSummary({
  stats,
}: {
  stats: WalletStatsSummary | undefined;
}) {
  const income = Number(stats?.totalIncome ?? 0);
  const expenses = Number(stats?.totalExpenses ?? 0);
  const net = Number(stats?.netBalance ?? 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 stagger-children">
      <div className="glass-card-static p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[var(--foreground-muted)]">
            Ingresos del mes
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-green-glow)]">
            <TrendingUp size={15} className="text-[var(--accent-green)]" />
          </div>
        </div>
        <div className="truncate text-xl font-bold tracking-tight tabular-nums text-[var(--accent-green)]">
          +{formatMoney(income, "ARS")}
        </div>
      </div>

      <div className="glass-card-static p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[var(--foreground-muted)]">
            Gastos del mes
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-red-glow)]">
            <TrendingDown
              size={15}
              className="text-[var(--accent-red)]"
            />
          </div>
        </div>
        <div className="truncate text-xl font-bold tracking-tight tabular-nums text-[var(--accent-red)]">
          -{formatMoney(expenses, "ARS")}
        </div>
      </div>

      <div className="glass-card-static p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[var(--foreground-muted)]">Neto</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--hover-overlay)]">
            <Minus size={15} className="text-[var(--foreground-muted)]" />
          </div>
        </div>
        <div className="truncate text-xl font-bold tracking-tight tabular-nums">{formatMoney(net, "ARS")}</div>
      </div>
    </div>
  );
}
