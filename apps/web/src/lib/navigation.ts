import {
  ListChecks,
  LayoutDashboard,
  History,
  type LucideIcon,
} from "lucide-react";

export type DomainKey = "tasks";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface DomainConfig {
  key: DomainKey;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  iconLetter: string;
  agentEndpoint: string;
  chatPlaceholder: string;
  chatWelcome: string;
  chatDescription: string;
  aiDescription: string;
  navItems: NavItem[];
}

export const domains: DomainConfig[] = [
  {
    key: "tasks",
    label: "Tasks",
    subtitle: "Tareas",
    icon: ListChecks,
    iconLetter: "T",
    agentEndpoint: "/tasks/agent/chat",
    chatPlaceholder: "Agrega una tarea o pregunta algo...",
    chatWelcome: "Hola! Soy tu asistente de tareas",
    chatDescription: "Podes pedirme que cree tareas, marque como completadas o te de un resumen del dia",
    aiDescription: "Usa el chat para gestionar tus tareas con IA",
    navItems: [
      { href: "/tasks", label: "Hoy", icon: LayoutDashboard },
      { href: "/tasks/history", label: "Historial", icon: History },
    ],
  },
];

export function getDomainConfig(key: string): DomainConfig | undefined {
  return domains.find((d) => d.key === key);
}

export function getDomainFromPathname(pathname: string): DomainKey | null {
  const segment = pathname.split("/")[1];
  if (domains.some((d) => d.key === segment)) return segment as DomainKey;
  return null;
}
