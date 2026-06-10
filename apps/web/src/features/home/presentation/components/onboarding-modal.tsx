import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  ONBOARDING_STEPS,
  type OnboardingStep,
} from "@/features/home/presentation/onboarding-storage";

const accentClassName: Record<OnboardingStep["accent"], string> = {
  violet:
    "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--violet-soft-text)]",
  blue: "border-[var(--blue-soft-border)] bg-[var(--blue-soft-bg)] text-[var(--blue-soft-text)]",
  emerald:
    "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)] text-[var(--emerald-soft-text)]",
};

interface OnboardingModalProps {
  open: boolean;
  stepIndex: number;
  onNext: () => void;
}

export function OnboardingModal({
  open,
  stepIndex,
  onNext,
}: OnboardingModalProps) {
  if (!open) {
    return null;
  }

  const safeIndex = Math.min(Math.max(stepIndex, 0), ONBOARDING_STEPS.length - 1);
  const step = ONBOARDING_STEPS[safeIndex];
  const isLastStep = safeIndex === ONBOARDING_STEPS.length - 1;
  const ctaLabel = isLastStep ? "Empezar" : "Siguiente";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[rgba(2,6,23,0.72)] px-4 py-6 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenido a VDP"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[30px] border border-[var(--glass-border)] bg-[var(--glass)] shadow-[var(--shadow-xl)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 18% 18%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 30%), radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--accent-purple) 18%, transparent), transparent 28%), radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--accent-green) 12%, transparent), transparent 35%)",
          }}
        />

        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />
                Bienvenido a VDP
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                {safeIndex + 1} / {ONBOARDING_STEPS.length}
              </div>
            </div>

            <div className="space-y-4">
              <div
                className={`inline-flex h-16 w-16 items-center justify-center rounded-[22px] border text-3xl shadow-lg ${accentClassName[step.accent]}`}
              >
                {step.emoji}
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                  {step.title}
                </h2>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--foreground-secondary)]">
                  {step.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {ONBOARDING_STEPS.map((item, index) => {
                const isActive = index === safeIndex;
                return (
                  <span
                    key={item.title}
                    aria-current={isActive ? "step" : undefined}
                    className={`h-2.5 rounded-full transition-all ${
                      isActive
                        ? "w-10 bg-[var(--foreground)]"
                        : "w-2.5 bg-[var(--glass-border-hover)]"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 rounded-[26px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-5 sm:p-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                <CheckCircle2 size={12} className="text-[var(--accent-green)]" />
                Lo esencial en menos de un minuto
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-secondary)]">
                VDP junta foco, registro y contexto en un mismo lugar. Empezás por
                lo que importa hoy y el sistema te ayuda a no perder el hilo.
              </p>
            </div>

            <button
              type="button"
              onClick={onNext}
              className="btn-primary w-full justify-center py-3 text-sm"
            >
              {ctaLabel}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
