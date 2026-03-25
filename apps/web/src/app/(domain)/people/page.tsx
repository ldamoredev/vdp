"use client";

import { DemoModulePage } from "@/components/demo/demo-module-page";

const config = {
  name: "People",
  tagline: "Cuidá tus relaciones, no pierdas el hilo de nadie",
  heroDescription:
    "Un espacio para gestionar tus contactos y relaciones de forma intencional. Registrá interacciones, recordá fechas importantes y mantené visible tu red de vínculos para que ninguna relación se enfríe sin querer.",
  iconLetter: "P",
  features: [
    {
      icon: "👤",
      title: "Directorio de contactos",
      description:
        "Todos tus contactos organizados con notas, etiquetas y contexto relevante para cada relación.",
    },
    {
      icon: "🎂",
      title: "Recordatorios de fechas",
      description:
        "Cumpleaños, aniversarios y fechas importantes con alertas automáticas para que nunca se te pase.",
    },
    {
      icon: "💬",
      title: "Notas de interacción",
      description:
        "Registrá de qué hablaste, qué prometiste y qué temas pendientes tenés con cada persona.",
    },
    {
      icon: "🔗",
      title: "Círculos de relación",
      description:
        "Agrupá tus contactos en círculos (familia, amigos, trabajo) para priorizar tu energía social.",
    },
  ],
  previewTitle: "Próximos cumpleaños",
  previewItems: [
    { label: "Mamá", value: "28 Mar", accent: true },
    { label: "Nico (amigo)", value: "03 Abr", accent: false },
    { label: "Laura (trabajo)", value: "15 Abr", accent: false },
    { label: "Papá", value: "22 Abr", accent: true },
    { label: "Cami (prima)", value: "01 May", accent: false },
  ],
  softBg: "var(--purple-soft-bg)",
  softText: "var(--purple-soft-text)",
  softBorder: "var(--purple-soft-border)",
} as const;

export default function PeopleDashboard() {
  return <DemoModulePage config={config} />;
}
