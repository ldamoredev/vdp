"use client";

import { DemoModulePage } from "@/components/demo/demo-module-page";

const config = {
  name: "Work",
  tagline: "Tu carrera profesional, gestionada con intención",
  heroDescription:
    "Llevá el control de tu vida profesional en un solo lugar. Registrá proyectos, logros y metas de carrera para tomar decisiones informadas y avanzar con claridad en tu desarrollo profesional.",
  iconLetter: "K",
  features: [
    {
      icon: "📋",
      title: "Tracking de proyectos",
      description:
        "Seguimiento de tus proyectos activos con estado, deadlines y métricas de avance.",
    },
    {
      icon: "🏆",
      title: "Registro de logros",
      description:
        "Documentá tus logros y contribuciones para tener un historial completo de tu impacto profesional.",
    },
    {
      icon: "🤝",
      title: "Red profesional",
      description:
        "Mantené visibles tus contactos profesionales y las oportunidades de networking.",
    },
    {
      icon: "🎯",
      title: "Metas de carrera",
      description:
        "Definí objetivos a corto y largo plazo, con hitos medibles y revisiones periódicas.",
    },
  ],
  previewTitle: "Proyectos activos",
  previewChart: [45, 72, 60, 85, 55, 30, 90] as const,
  previewItems: [
    { label: "VDP — Life OS", value: "En progreso", accent: true },
    { label: "Cliente Fintech", value: "Review", accent: false },
    { label: "Curso Arquitectura", value: "Planificado", accent: false },
    { label: "Open source contrib", value: "En pausa", accent: false },
  ],
  softBg: "var(--amber-soft-bg)",
  softText: "var(--amber-soft-text)",
  softBorder: "var(--amber-soft-border)",
} as const;

export default function WorkDashboard() {
  return <DemoModulePage config={config} />;
}
