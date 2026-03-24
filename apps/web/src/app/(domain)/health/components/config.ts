import { Footprints, Moon, Droplets, Flame, Zap, Smile } from "lucide-react";

export const metricConfig: Record<string, { label: string; icon: any; color: string; target?: number; unit: string }> = {
  steps: { label: "Pasos", icon: Footprints, color: "emerald", target: 10000, unit: "steps" },
  sleep_hours: { label: "Sueno", icon: Moon, color: "blue", target: 8, unit: "hours" },
  water_ml: { label: "Agua", icon: Droplets, color: "cyan", target: 2500, unit: "ml" },
  calories: { label: "Calorias", icon: Flame, color: "amber", target: 2200, unit: "kcal" },
  energy: { label: "Energia", icon: Zap, color: "yellow", target: 5, unit: "scale" },
  mood: { label: "Animo", icon: Smile, color: "purple", target: 5, unit: "scale" },
};

export const colorStyles: Record<string, { background: string; color: string }> = {
  emerald: { background: "var(--emerald-soft-bg)", color: "var(--emerald-soft-text)" },
  blue: { background: "var(--blue-soft-bg)", color: "var(--blue-soft-text)" },
  cyan: { background: "var(--blue-soft-bg)", color: "var(--blue-soft-text)" },
  amber: { background: "var(--amber-soft-bg)", color: "var(--amber-soft-text)" },
  yellow: { background: "var(--amber-soft-bg)", color: "var(--amber-soft-text)" },
  purple: { background: "var(--purple-soft-bg)", color: "var(--purple-soft-text)" },
};
