export function SkeletonCard() {
  return (
    <div className="glass-card-static p-5 animate-pulse">
      <div className="h-4 w-24 rounded bg-[var(--hover-overlay)]" />
      <div className="mt-4 h-8 w-32 rounded bg-[var(--hover-overlay)]" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[var(--hover-overlay)]" />
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-[var(--hover-overlay)]" />
          <div className="h-3 w-16 rounded bg-[var(--hover-overlay)]" />
        </div>
      </div>
      <div className="h-4 w-20 rounded bg-[var(--hover-overlay)]" />
    </div>
  );
}
