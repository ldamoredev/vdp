import { formatMetricValue } from "@/lib/format";
import { colorStyles, metricConfig } from "./config";

interface MetricCardProps {
  type: string;
  metric: { value: string } | undefined;
}

export function MetricCard({ type, metric }: MetricCardProps) {
  const config = metricConfig[type];
  if (!config) return null;

  const Icon = config.icon;
  const value = metric ? parseFloat(metric.value) : 0;
  const pct = config.target ? Math.min(100, Math.round((value / config.target) * 100)) : 0;
  const displayValue = metric ? formatMetricValue(metric.value, config.unit) : "--";
  const targetLabel = config.target ? `/ ${formatMetricValue(config.target, config.unit)}` : "";

  return (
    <div className="glass-card p-4 cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[var(--foreground-muted)]">{config.label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={colorStyles[config.color]}>
          <Icon size={13} />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-semibold tracking-tight ${!metric ? "text-[var(--muted)]" : ""}`}>
          {displayValue}
        </span>
      </div>
      {targetLabel && (
        <>
          <span className="text-[10px] text-[var(--muted)]">{targetLabel}</span>
          <div className="progress-bar mt-2">
            <div className="progress-bar-fill green" style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
    </div>
  );
}
