import { formatDate } from "@/lib/format";

export type WalletScreenKey =
  | "dashboard"
  | "transactions"
  | "stats"
  | "accounts"
  | "categories"
  | "savings"
  | "investments";

type WalletEmptyState = {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const screenIntros: Record<WalletScreenKey, string> = {
  dashboard: "Resumen operativo de tus cuentas, movimientos y señales del dia",
  transactions:
    "Movimientos listos para revisar, corregir y filtrar sin perder contexto",
  stats: "Totales y categorias con el detalle necesario para verificar cada numero",
  accounts: "Cuentas activas, saldo inicial y tipo en una sola vista",
  categories: "Categorias claras para capturar y revisar gastos sin friccion",
  savings: "Objetivos con progreso, contexto y acciones visibles",
  investments: "Posiciones activas con retorno y estado faciles de leer",
};

const emptyStates: Record<WalletScreenKey, WalletEmptyState> = {
  dashboard: {
    title: "Todavía no hay actividad",
    body: "Cuando registres movimientos y cargues cuentas, vas a ver el resumen operativo acá.",
    ctaLabel: "Registrar movimiento",
    ctaHref: "/wallet/transactions/new",
  },
  transactions: {
    title: "Todavía no hay movimientos",
    body: "Cuando registres ingresos o gastos, los vas a ver ordenados y listos para revisar.",
    ctaLabel: "Registrar movimiento",
    ctaHref: "/wallet/transactions/new",
  },
  stats: {
    title: "Todavía no hay estadísticas",
    body: "Necesitas algunos movimientos para empezar a revisar categorías y tendencias.",
    ctaLabel: "Registrar movimiento",
    ctaHref: "/wallet/transactions/new",
  },
  accounts: {
    title: "Todavía no hay cuentas",
    body: "Crea una cuenta para empezar a ordenar saldos, gastos e ingresos.",
  },
  categories: {
    title: "Todavía no hay categorías",
    body: "Agrega categorías claras para capturar y revisar tus movimientos sin fricción.",
  },
  savings: {
    title: "Todavía no hay objetivos",
    body: "Tus objetivos de ahorro van a aparecer acá con progreso y contexto accionable.",
  },
  investments: {
    title: "Todavía no hay inversiones",
    body: "Cuando cargues una posición, vas a poder seguir retorno, monto y estado desde esta vista.",
  },
};

export function buildWalletScreenIntro(screen: WalletScreenKey): string {
  return screenIntros[screen];
}

export function buildWalletEmptyState(screen: WalletScreenKey): WalletEmptyState {
  return emptyStates[screen];
}

export function buildWalletTransactionMeta({
  categoryName,
  date,
}: {
  categoryName?: string | null;
  date: string;
}): string {
  const parts = [];

  if (categoryName) {
    parts.push(categoryName);
  }

  parts.push(formatDate(date));

  return parts.join(" · ");
}
