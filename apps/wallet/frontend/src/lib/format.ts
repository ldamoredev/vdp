import { CURRENCIES } from "@vdp/shared";

export function formatMoney(amount: string | number, currency: "ARS" | "USD") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const curr = CURRENCIES[currency];
  return `${curr.symbol} ${num.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
