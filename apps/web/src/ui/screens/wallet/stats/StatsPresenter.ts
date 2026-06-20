import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { Currency } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { EnsureFreshDollarRates } from "@/core/app/wallet/EnsureFreshDollarRates";
import { GetExchangeRates } from "@/core/app/wallet/GetExchangeRates";
import { GetWalletMonthlyTrend } from "@/core/app/wallet/GetWalletMonthlyTrend";
import { GetWalletStatsByCategory } from "@/core/app/wallet/GetWalletStatsByCategory";
import { type ExchangeRate, latestDollarRates } from "@/core/domain/wallet/ExchangeRate";
import type { CategoryStat, MonthlyTrend } from "@/core/domain/wallet/WalletStats";
import { formatDate, formatMoney } from "@/lib/format";
import {
  getPresentationCurrency,
  setPresentationCurrency,
  subscribePresentationCurrency,
} from "@/lib/preferences/presentation-currency";
import type {
  ByCategoryVM,
  CategorySliceVM,
  DollarRatesVM,
  MonthlyTrendVM,
  StatsViewModel,
} from "@/ui/models/wallet/StatsViewModel";
import { walletScreenIntro } from "../wallet-copy";

const COLORS = [
  "var(--accent)",
  "var(--accent-green)",
  "var(--accent-red)",
  "var(--accent-amber)",
  "var(--accent-purple)",
  "var(--rose-soft-text)",
  "var(--cyan-soft-text)",
  "var(--green-soft-text)",
];

const PRESENTATION_CURRENCY_OPTIONS: Currency[] = ["ARS", "USD"];

/**
 * Drives the stats screen: loads the by-category breakdown, the monthly trend
 * and the latest dollar rates, and shapes them for the charts. Read-only.
 * Monetary aggregates are already normalized by the backend to their
 * presentation currency; the presenter only formats the currency it receives.
 */
export class StatsPresenter extends PresenterBase<StatsViewModel> {
  private byCategory: CategoryStat[] = [];
  private monthlyTrend: MonthlyTrend[] = [];
  private dollarRates: ExchangeRate[] = [];
  private presentationCurrency: Currency = getPresentationCurrency();
  private isLoading = true;
  private error = false;
  private loadRequestId = 0;
  private unsubscribeCurrency: (() => void) | null = null;
  private ratesEnsured = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): StatsViewModel {
    return this.buildModel();
  }

  start(): void {
    this.presentationCurrency = getPresentationCurrency();
    this.unsubscribeCurrency = subscribePresentationCurrency(() => this.syncPresentationCurrency());
    void this.bootstrap();
  }

  /** Load right away, then refresh a stale MEP quote in the background and
   * reload — the external quote never blocks first paint. */
  private async bootstrap(): Promise<void> {
    await this.load();
    await this.ensureFreshRates();
  }

  private async ensureFreshRates(): Promise<void> {
    if (this.ratesEnsured) return;
    this.ratesEnsured = true;
    try {
      const refreshed = await this.core.execute(new EnsureFreshDollarRates());
      if (refreshed) await this.load();
    } catch {
      // A failed refresh surfaces later as the error state when conversion fails.
    }
  }

  stop(): void {
    this.unsubscribeCurrency?.();
    this.unsubscribeCurrency = null;
  }

  /** Writes the universal preference; the subscription reloads the aggregates. */
  setPresentationCurrency(currency: Currency): void {
    setPresentationCurrency(currency);
  }

  private syncPresentationCurrency(): void {
    const next = getPresentationCurrency();
    if (next === this.presentationCurrency) return;
    this.presentationCurrency = next;
    void this.load();
  }

  private async load(): Promise<void> {
    const requestId = this.loadRequestId + 1;
    this.loadRequestId = requestId;
    this.isLoading = true;
    this.refresh();
    const params = this.statsParams();
    try {
      const [byCategory, monthlyTrend, rates] = await Promise.all([
        this.core.execute(new GetWalletStatsByCategory(params)),
        this.core.execute(new GetWalletMonthlyTrend(params)),
        this.core.execute(new GetExchangeRates()),
      ]);
      if (requestId !== this.loadRequestId) return;
      this.byCategory = byCategory;
      this.monthlyTrend = monthlyTrend;
      this.dollarRates = latestDollarRates(rates);
      this.error = false;
    } catch {
      if (requestId !== this.loadRequestId) return;
      // Drop stale aggregates so the panels never show the previous currency's
      // numbers as if they had been converted.
      this.byCategory = [];
      this.monthlyTrend = [];
      this.dollarRates = [];
      this.error = true;
    }
    // Only the latest request reaches here (stale ones returned above), so it is
    // safe to clear the loading flag and publish the result.
    this.isLoading = false;
    this.refresh();
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): StatsViewModel {
    return {
      title: "Estadisticas",
      intro: walletScreenIntro("stats"),
      presentationCurrency: this.presentationCurrency,
      currencyOptions: this.currencyOptionsVM(),
      error: this.error,
      monthlyTrend: this.monthlyTrendVM(),
      dollarRates: this.dollarRatesVM(),
      byCategory: this.byCategoryVM(),
    };
  }

  private statsParams(): Record<string, string> {
    return { currency: this.presentationCurrency };
  }

  private currencyOptionsVM(): StatsViewModel["currencyOptions"] {
    return PRESENTATION_CURRENCY_OPTIONS.map((currency) => ({
      currency,
      label: currency,
      selected: currency === this.presentationCurrency,
    }));
  }

  private monthlyTrendVM(): MonthlyTrendVM {
    return {
      isLoading: this.isLoading,
      isEmpty: !this.isLoading && this.monthlyTrend.length === 0,
      bars: this.monthlyTrend.map((item) => ({
        label: formatDate(`${item.month}-01`, "MMM yy"),
        currency: item.currency,
        income: item.income,
        expense: item.expense,
      })),
    };
  }

  private dollarRatesVM(): DollarRatesVM {
    return {
      isLoading: this.isLoading,
      isEmpty: !this.isLoading && this.dollarRates.length === 0,
      items: this.dollarRates.map((rate) => ({
        id: rate.id,
        typeLabel: rate.type,
        dateLabel: formatDate(rate.date),
        rateLabel: formatMoney(rate.rate, "ARS"),
      })),
    };
  }

  private byCategoryVM(): ByCategoryVM {
    const transactionCount = this.byCategory.reduce((sum, item) => sum + item.count, 0);
    return {
      isLoading: this.isLoading,
      isEmpty: !this.isLoading && this.byCategory.length === 0,
      sanity: { transactionCount, totalLabel: this.totalByCurrencyLabel() },
      slices: this.byCategory.map((item, index) => this.sliceVM(item, index)),
    };
  }

  /** Per-currency totals joined into one label; never sums ARS and USD. */
  private totalByCurrencyLabel(): string {
    const totals = new Map<CategoryStat["currency"], number>();
    for (const item of this.byCategory) {
      totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.total);
    }
    return Array.from(totals.entries())
      .map(([currency, total]) => formatMoney(total, currency))
      .join(" · ");
  }

  private sliceVM(item: CategoryStat, index: number): CategorySliceVM {
    return {
      key: `${item.categoryId ?? "uncategorized"}-${item.currency}-${index}`,
      categoryId: item.categoryId,
      name: item.categoryName,
      movementsLabel: `${item.count} movimientos`,
      totalValue: item.total,
      totalLabel: formatMoney(item.total, item.currency),
      color: COLORS[index % COLORS.length],
      href: item.categoryId
        ? `/wallet/transactions?type=expense&categoryId=${item.categoryId}`
        : null,
    };
  }
}
