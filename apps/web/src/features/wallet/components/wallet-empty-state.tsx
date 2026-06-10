import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface WalletEmptyStateProps {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function WalletEmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
}: WalletEmptyStateProps) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hover-overlay)]">
        <ArrowUpRight size={20} className="text-[var(--muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{body}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="btn-primary mt-4 inline-flex">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
