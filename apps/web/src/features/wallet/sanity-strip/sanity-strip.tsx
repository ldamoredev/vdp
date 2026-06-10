"use client";

import { formatDate } from "@/lib/format";

interface SanityStripProps {
  transactionCount: number;
  totalAmount: string;
  dateRange?: { from: string; to: string };
  label?: string;
}

export function SanityStrip({
  transactionCount,
  totalAmount,
  dateRange,
  label,
}: SanityStripProps) {
  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-xs text-[var(--muted)]">
      <span>{transactionCount} movimientos</span>
      <span> · </span>
      <span>
        {totalAmount}
        {label ? ` ${label}` : ""}
      </span>
      {dateRange ? (
        <>
          <span> · </span>
          <span>
            {formatDate(dateRange.from)} — {formatDate(dateRange.to)}
          </span>
        </>
      ) : null}
    </div>
  );
}
