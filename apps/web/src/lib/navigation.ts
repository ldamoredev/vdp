import {
  ListChecks,
  Wallet,
  Heart,
  Users,
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  BarChart3,
  Activity,
  Pill,
  Calendar,
  Ruler,
  Target,
  History,
  type LucideIcon,
} from "lucide-react";

export type DomainKey = "tasks" | "wallet" | "health" | "people" | "work" | "study";

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
  {
    key: "wallet",
    label: "Wallet",
    subtitle: "Finanzas",
    icon: Wallet,
    iconLetter: "W",
    agentEndpoint: "/agent/chat",
    chatPlaceholder: "Registra un gasto de 5000 en comida...",
    chatWelcome: "Hola! Soy tu asistente financiero",
    chatDescription: "Podes pedirme que registre gastos, consultar saldos, ver estadisticas y mas",
    aiDescription: "Usa el chat para gestionar tus finanzas con IA",
    navItems: [
      { href: "/wallet", label: "Dashboard", icon: LayoutDashboard },
      { href: "/wallet/transactions", label: "Transacciones", icon: ArrowLeftRight },
      { href: "/wallet/savings", label: "Ahorros", icon: PiggyBank },
      { href: "/wallet/investments", label: "Inversiones", icon: TrendingUp },
      { href: "/wallet/stats", label: "Estadisticas", icon: BarChart3 },
    ],
  },
  {
    key: "health",
    label: "Health",
    subtitle: "Salud",
    icon: Heart,
    iconLetter: "H",
    agentEndpoint: "/health/agent/chat",
    chatPlaceholder: "Registra 8 horas de sueno...",
    chatWelcome: "Hola! Soy tu asistente de salud",
    chatDescription: "Podes pedirme que registre metricas, consultar habitos, ver tendencias y mas",
    aiDescription: "Usa el chat para gestionar tu salud con IA",
    navItems: [
      { href: "/health", label: "Dashboard", icon: LayoutDashboard },
      { href: "/health/metrics", label: "Metricas", icon: Activity },
      { href: "/health/habits", label: "Habitos", icon: Target },
      { href: "/health/medications", label: "Medicamentos", icon: Pill },
      { href: "/health/appointments", label: "Turnos", icon: Calendar },
      { href: "/health/body", label: "Cuerpo", icon: Ruler },
    ],
  },
  {
    key: "people",
    label: "People",
    subtitle: "Relaciones",
    icon: Users,
    iconLetter: "P",
    agentEndpoint: "/people/agent/chat",
    chatPlaceholder: "Preguntame sobre tus contactos...",
    chatWelcome: "Hola! Soy tu asistente de relaciones",
    chatDescription: "Te ayudo a mantener tus relaciones al dia",
    aiDescription: "Usa el chat para gestionar tus relaciones con IA",
    navItems: [
      { href: "/people", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    key: "work",
    label: "Work",
    subtitle: "Trabajo",
    icon: Briefcase,
    iconLetter: "W",
    agentEndpoint: "/work/agent/chat",
    chatPlaceholder: "Que tengo pendiente hoy?",
    chatWelcome: "Hola! Soy tu asistente de trabajo",
    chatDescription: "Te ayudo a organizar tu jornada laboral",
    aiDescription: "Usa el chat para organizar tu trabajo con IA",
    navItems: [
      { href: "/work", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    key: "study",
    label: "Study",
    subtitle: "Estudio",
    icon: GraduationCap,
    iconLetter: "S",
    agentEndpoint: "/study/agent/chat",
    chatPlaceholder: "Que deberia estudiar hoy?",
    chatWelcome: "Hola! Soy tu asistente de estudio",
    chatDescription: "Te ayudo a planificar tu aprendizaje",
    aiDescription: "Usa el chat para planificar tu estudio con IA",
    navItems: [
      { href: "/study", label: "Dashboard", icon: LayoutDashboard },
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
