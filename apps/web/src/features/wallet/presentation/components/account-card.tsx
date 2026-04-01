import { Wallet } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/lib/api/types";

export function AccountCard({ account }: { account: Account }) {
  const balance = Number(account.currentBalance ?? account.initialBalance);

  return (
    <div className="glass-card p-5 cursor-pointer group">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-sm text-[var(--foreground-muted)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-glow)]">
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
