import type {
  CategoryStat as CategoryStatDto,
  MonthlyTrend as MonthlyTrendDto,
  WalletStatsSummary as WalletStatsSummaryDto,
} from "@vdp/shared";

/**
 * Stats read models. Plain data (reuse the wire shapes). These are
 * already-aggregated, per-query figures from the backend; the presenter formats
 * and labels them.
 */
export type WalletStatsSummary = WalletStatsSummaryDto;
export type CategoryStat = CategoryStatDto;
export type MonthlyTrend = MonthlyTrendDto;
