export function SkeletonCard() {
  return (
    <div className="glass-card-static p-5 space-y-3">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-8 w-36" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-xl" />
        <div className="space-y-2">
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="skeleton h-4 w-24" />
    </div>
  );
}
