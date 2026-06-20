import type { Currency } from "@vdp/shared";

export interface CurrencySelectorOptionVM {
  currency: Currency;
  label: string;
  selected: boolean;
}

export function CurrencySelector({
  options,
  onSelect,
  className = "",
}: {
  options: CurrencySelectorOptionVM[];
  onSelect: (currency: Currency) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-1 ${className}`}
      aria-label="Moneda de presentacion"
    >
      {options.map((option) => (
        <button
          key={option.currency}
          type="button"
          aria-pressed={option.selected}
          onClick={() => onSelect(option.currency)}
          className={[
            "min-w-16 rounded-full px-4 py-2 text-sm font-semibold transition-all",
            option.selected
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
