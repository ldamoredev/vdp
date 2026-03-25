"use client";

import { DemoModulePage } from "@/components/demo/demo-module-page";

const config = {
  name: "Study",
  tagline: "Aprendé con propósito, no pierdas el rumbo",
  heroDescription:
    "Organizá tu aprendizaje de forma estructurada. Llevá registro de cursos, notas y progreso para que cada hora de estudio cuente. Con repetición espaciada y seguimiento de objetivos, tu conocimiento se consolida.",
  iconLetter: "S",
  features: [
    {
      icon: "📚",
      title: "Cursos y recursos",
      description:
        "Organizá todo lo que estás aprendiendo: cursos online, libros, tutoriales y documentación.",
    },
    {
      icon: "📝",
      title: "Notas de estudio",
      description:
        "Tomá notas vinculadas a cada recurso para tener todo el contexto a mano cuando lo necesites.",
    },
    {
      icon: "📊",
      title: "Seguimiento de progreso",
      description:
        "Visualizá cuánto avanzaste en cada curso o tema, con métricas claras de dedicación.",
    },
    {
      icon: "🧠",
      title: "Repetición espaciada",
      description:
        "Revisá conceptos clave en intervalos óptimos para maximizar la retención a largo plazo.",
    },
  ],
  previewTitle: "Progreso de cursos",
  previewChart: [30, 55, 80, 45, 65, 70, 50] as const,
  previewItems: [
    { label: "System Design — Fundamentals", value: "80%", accent: true },
    { label: "TypeScript Avanzado", value: "62%", accent: true },
    { label: "PostgreSQL Performance", value: "45%", accent: false },
    { label: "Diseño de APIs REST", value: "28%", accent: false },
    { label: "Kubernetes Basics", value: "12%", accent: false },
  ],
  softBg: "var(--rose-soft-bg)",
  softText: "var(--rose-soft-text)",
  softBorder: "var(--rose-soft-border)",
} as const;

export default function StudyDashboard() {
  return <DemoModulePage config={config} />;
}
