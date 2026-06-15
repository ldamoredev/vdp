/**
 * Spanish presentation copy shared by the wallet screens: section intros and
 * empty states. This is the UI-facing text that the legacy
 * wallet-polish-selectors held; it lives in ui/ because the domain layer is
 * presentation-free. Reused across the wallet presenters.
 */

export type WalletScreenKey =
  | "dashboard"
  | "transactions"
  | "stats"
  | "accounts"
  | "categories"
  | "savings"
  | "investments";

export interface WalletEmptyStateCopy {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

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

const emptyStates: Record<WalletScreenKey, WalletEmptyStateCopy> = {
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

export function walletScreenIntro(screen: WalletScreenKey): string {
  return screenIntros[screen];
}

export function walletEmptyState(screen: WalletScreenKey): WalletEmptyStateCopy {
  return emptyStates[screen];
}

/** Spanish labels for account types (presentation; domain stays language-free). */
export const ACCOUNT_TYPE_LABELS: Record<
  "cash" | "bank" | "crypto" | "investment",
  string
> = {
  cash: "Efectivo",
  bank: "Banco",
  crypto: "Crypto",
  investment: "Inversion",
};

/** Spanish labels for investment types (presentation; domain stays language-free). */
export const INVESTMENT_TYPE_LABELS: Record<
  "plazo_fijo" | "fci" | "cedear" | "crypto" | "bond" | "other",
  string
> = {
  plazo_fijo: "Plazo fijo",
  fci: "FCI",
  cedear: "CEDEAR",
  crypto: "Crypto",
  bond: "Bono",
  other: "Otro",
};
