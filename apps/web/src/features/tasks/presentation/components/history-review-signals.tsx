import { Sparkles } from "lucide-react";
import { getSignalToneClasses } from "../history-selectors";
import { useHistoryData } from "../use-history-context";

export function HistoryReviewSignals() {
  const { review, reviewSignals } = useHistoryData();

  if (!review) return null;

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {reviewSignals.map((signal) => (
        <div
          key={signal.title}
          className={`rounded-[28px] border p-5 ${getSignalToneClasses(signal.tone)}`}
        >
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Sparkles size={14} />
            <h3 className="text-sm font-medium">{signal.title}</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            {signal.detail}
          </p>
        </div>
      ))}
    </section>
  );
}
