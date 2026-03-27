import { Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";

interface AccountCardProps {
  readonly account: {
    readonly id: string;
    readonly name: string;
    readonly currency: string;
    readonly currentBalance?: string;
    readonly initialBalance: string;
  };
}

export function AccountCard({ account }: AccountCardProps) {
  const balance = Number(account.currentBalance ?? account.initialBalance);
  return (
    <div className="glass-card p-5 cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 text-[var(--foreground-muted)] text-sm">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
            <Wallet size={15} className="text-[var(--accent)]" />
          </div>
          <span className="font-medium">{account.name}</span>
        </div>
        <span className="badge badge-muted">{account.currency}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">
        {formatMoney(balance, account.currency as "ARS" | "USD")}
      </div>
    </div>
  );
}
