export default function DomainLoading() {
  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      {/* Header skeleton */}
      <div>
        <div className="skeleton h-7 w-40 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card-static p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="skeleton h-4 w-24" />
            </div>
            <div className="skeleton h-8 w-36" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="glass-card-static overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)]">
          <div className="skeleton h-4 w-48" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 border-b border-[var(--divider)] last:border-0">
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-48" />
              <div className="skeleton h-3 w-24" />
            </div>
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
