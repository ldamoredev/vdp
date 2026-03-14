export const CURRENCIES = {
  ARS: { code: "ARS", name: "Peso Argentino", symbol: "$", decimals: 2 },
  USD: { code: "USD", name: "US Dollar", symbol: "US$", decimals: 2 },
} as const;

export const DEFAULT_CATEGORIES = {
  expense: [
    { name: "Comida", icon: "🍔" },
    { name: "Transporte", icon: "🚗" },
    { name: "Alquiler", icon: "🏠" },
    { name: "Servicios", icon: "💡" },
    { name: "Salud", icon: "🏥" },
    { name: "Entretenimiento", icon: "🎮" },
    { name: "Ropa", icon: "👕" },
    { name: "Educacion", icon: "📚" },
    { name: "Supermercado", icon: "🛒" },
    { name: "Otros", icon: "📦" },
  ],
  income: [
    { name: "Sueldo", icon: "💰" },
    { name: "Freelance", icon: "💻" },
    { name: "Inversiones", icon: "📈" },
    { name: "Otros ingresos", icon: "💵" },
  ],
} as const;
