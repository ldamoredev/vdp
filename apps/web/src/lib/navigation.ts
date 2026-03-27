import {
  ListChecks,
  LayoutDashboard,
  History,
  Wallet,
  PiggyBank,
  TrendingUp,
  BarChart3,
  CreditCard,
  HeartPulse,
  Activity,
  Pill,
  CalendarHeart,
  Dumbbell,
  Apple,
  Users,
  UserCircle,
  CalendarDays,
  MessageSquare,
  Briefcase,
  FolderKanban,
  Trophy,
  Target,
  GraduationCap,
  BookOpen,
  Brain,
  Clock,
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
  disabled?: boolean;
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
    agentEndpoint: "/wallet/agent/chat",
    chatPlaceholder: "Consulta tus finanzas...",
    chatWelcome: "Hola! Soy tu asistente financiero",
    chatDescription: "Podes pedirme que registre gastos, consulte tu balance o liste movimientos recientes",
    aiDescription: "Usa el chat para registrar movimientos y revisar tu estado financiero",
    navItems: [
      { href: "/wallet", label: "Dashboard", icon: LayoutDashboard },
      { href: "/wallet/transactions", label: "Movimientos", icon: CreditCard },
      { href: "/wallet/stats", label: "Estadisticas", icon: BarChart3 },
      { href: "/wallet/savings", label: "Ahorros", icon: PiggyBank },
      { href: "/wallet/investments", label: "Inversiones", icon: TrendingUp },
    ],
  },
  {
    key: "health",
    label: "Health",
    subtitle: "Salud",
    icon: HeartPulse,
    iconLetter: "H",
    disabled: true,
    agentEndpoint: "/health/agent/chat",
    chatPlaceholder: "Consulta tu salud...",
    chatWelcome: "Hola! Soy tu asistente de salud",
    chatDescription: "Podes pedirme que registre metricas, te recuerde medicamentos o consulte tus habitos",
    aiDescription: "Usa el chat para gestionar tu salud con IA",
    navItems: [
      { href: "/health", label: "Dashboard", icon: LayoutDashboard },
      { href: "/health/habits", label: "Habitos", icon: Dumbbell },
      { href: "/health/metrics", label: "Metricas", icon: Activity },
      { href: "/health/medications", label: "Medicamentos", icon: Pill },
      { href: "/health/appointments", label: "Turnos", icon: CalendarHeart },
      { href: "/health/body", label: "Cuerpo", icon: Apple },
    ],
  },
  {
    key: "people",
    label: "People",
    subtitle: "Personas",
    icon: Users,
    iconLetter: "P",
    disabled: true,
    agentEndpoint: "/people/agent/chat",
    chatPlaceholder: "Consulta sobre tus contactos...",
    chatWelcome: "Hola! Soy tu asistente de relaciones",
    chatDescription: "Podes pedirme que busque contactos, te recuerde fechas importantes o registre interacciones",
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
    iconLetter: "K",
    disabled: true,
    agentEndpoint: "/work/agent/chat",
    chatPlaceholder: "Consulta sobre tu carrera...",
    chatWelcome: "Hola! Soy tu asistente profesional",
    chatDescription: "Podes pedirme que registre logros, gestione proyectos o planifique metas de carrera",
    aiDescription: "Usa el chat para gestionar tu carrera con IA",
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
    disabled: true,
    agentEndpoint: "/study/agent/chat",
    chatPlaceholder: "Consulta sobre tu aprendizaje...",
    chatWelcome: "Hola! Soy tu asistente de estudio",
    chatDescription: "Podes pedirme que organice cursos, registre notas o planifique sesiones de repaso",
    aiDescription: "Usa el chat para gestionar tu aprendizaje con IA",
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
