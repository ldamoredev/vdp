import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

interface InProgressPanelProps {
  readonly title: string;
  readonly description: string;
}

export function InProgressPanel({ title, description }: InProgressPanelProps) {
  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <Link
        href="/wallet"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft size={16} />
        Volver a Wallet
      </Link>

      <div className="glass-card-static p-8 md:p-10">
        <div className="w-12 h-12 rounded-2xl bg-[var(--blue-soft-bg)] text-[var(--blue-soft-text)] border border-[var(--blue-soft-border)] flex items-center justify-center mb-5">
          <Construction size={22} />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-relaxed text-[var(--foreground-muted)] max-w-2xl">
            {description}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="badge badge-blue">Wallet MVP</span>
          <span className="badge badge-muted">Vista temporalmente oculta</span>
        </div>
      </div>
    </div>
  );
}
