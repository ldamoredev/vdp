import { LoaderCircle, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";

import type {
  AdminSettingKey,
  AdminSettingToggleViewModel,
} from "@/ui/models/admin/AdminSettingsViewModel";
import { useAdminSettingsPresenter } from "./useAdminSettingsPresenter";

export function AdminSettingsSection() {
  const presenter = useAdminSettingsPresenter();
  const model = presenter.model;

  if (!model.visible) return null;

  return (
    <section className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
            Superadmin
          </p>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {model.title}
          </h2>
          <p className="text-sm leading-6 text-[var(--foreground-muted)]">
            {model.subtitle}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--accent)]">
          <ShieldCheck size={22} strokeWidth={1.8} />
        </div>
      </div>

      {model.error && (
        <div className="mb-4 rounded-2xl border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-4 py-3 text-sm text-[var(--amber-soft-text)]">
          {model.error}
        </div>
      )}

      {model.isLoading ? (
        <div className="flex items-center gap-3 rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-4 text-sm text-[var(--foreground-muted)]">
          <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin text-[var(--accent)]" />
          {model.loadingLabel}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {model.toggles.map((toggle) => (
            <AdminSettingToggle
              key={toggle.key}
              toggle={toggle}
              onToggle={(key) => void presenter.toggleSetting(key)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AdminSettingToggle({
  toggle,
  onToggle,
}: {
  toggle: AdminSettingToggleViewModel;
  onToggle: (key: AdminSettingKey) => void;
}) {
  const Icon = toggle.enabled ? ToggleRight : ToggleLeft;

  return (
    <article className="flex min-h-40 flex-col justify-between rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {toggle.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
            {toggle.description}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={toggle.enabled}
          aria-label={toggle.label}
          disabled={toggle.busy}
          onClick={() => onToggle(toggle.key)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all disabled:cursor-not-allowed disabled:opacity-55 ${
            toggle.enabled
              ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_10px_24px_var(--accent-glow)]"
              : "border-[var(--glass-border)] bg-[var(--card)] text-[var(--foreground-muted)] hover:bg-[var(--hover-overlay-strong)]"
          }`}
        >
          {toggle.busy ? (
            <LoaderCircle size={18} strokeWidth={1.8} className="animate-spin" />
          ) : (
            <Icon size={21} strokeWidth={1.8} />
          )}
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
          Estado
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            toggle.enabled
              ? "border-[var(--green-soft-border)] bg-[var(--green-soft-bg)] text-[var(--green-soft-text)]"
              : "border-[var(--glass-border)] bg-[var(--card)] text-[var(--foreground-muted)]"
          }`}
        >
          {toggle.statusLabel}
        </span>
      </div>
    </article>
  );
}
