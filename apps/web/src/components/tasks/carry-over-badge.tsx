interface CarryOverBadgeProps {
  count: number;
  className?: string;
}

export function CarryOverBadge({ count, className = "" }: CarryOverBadgeProps) {
  if (count <= 0) return null;

  const isBlocked = count >= 3;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isBlocked
          ? "border border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]"
          : "border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]"
      } ${className}`}
      title={
        isBlocked
          ? `Bloqueada: postergada ${count} veces`
          : `Postergada ${count} ${count === 1 ? "vez" : "veces"}`
      }
    >
      ↻ {count}
    </span>
  );
}
