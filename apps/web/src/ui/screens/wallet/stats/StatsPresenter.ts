import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { GetExchangeRates } from "@/core/app/wallet/GetExchangeRates";
import { GetWalletMonthlyTrend } from "@/core/app/wallet/GetWalletMonthlyTrend";
import { GetWalletStatsByCategory } from "@/core/app/wallet/GetWalletStatsByCategory";
import { type ExchangeRate, latestDollarRates } from "@/core/domain/wallet/ExchangeRate";
import type { CategoryStat, MonthlyTrend } from "@/core/domain/wallet/WalletStats";
import { formatDate, formatMoney } from "@/lib/format";
import type {
  ByCategoryVM,
  CategorySliceVM,
  DollarRatesVM,
  MonthlyTrendVM,
  StatsViewModel,
} from "@/ui/models/wallet/StatsViewModel";
import { walletScreenIntro } from "../wallet-copy";

const COLORS = [
  "#3B82F6",
  "#22C55E",
  "#EF4444",
  "#F59E0B",
  "#A855F7",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

/**
 * Drives the stats screen: loads the by-category breakdown, the monthly trend
 * and the latest dollar rates, and shapes them for the charts. Read-only.
 * NOTE: the backend stats figures are not split by currency, so amounts are
 * labelled ARS (legacy parity) — currency-aware stats is a backend concern.
 */
export class StatsPresenter extends PresenterBase<StatsViewModel> {
  private byCategory: CategoryStat[] = [];
  private monthlyTrend: MonthlyTrend[] = [];
  private dollarRates: ExchangeRate[] = [];
  private isLoading = true;
  private error = false;

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
    void this.load();
  }

  stop(): void {}

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      const [byCategory, monthlyTrend, rates] = await Promise.all([
        this.core.execute(new GetWalletStatsByCategory()),
        this.core.execute(new GetWalletMonthlyTrend()),
        this.core.execute(new GetExchangeRates()),
      ]);
      this.byCategory = byCategory;
      this.monthlyTrend = monthlyTrend;
      this.dollarRates = latestDollarRates(rates);
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): StatsViewModel {
    return {
      title: "Estadisticas",
      intro: walletScreenIntro("stats"),
      monthlyTrend: this.monthlyTrendVM(),
      dollarRates: this.dollarRatesVM(),
      byCategory: this.byCategoryVM(),
    };
  }

  private monthlyTrendVM(): MonthlyTrendVM {
    return {
      isLoading: this.isLoading,
      isEmpty: !this.isLoading && this.monthlyTrend.length === 0,
      bars: this.monthlyTrend.map((item) => ({
        label: formatDate(`${item.month}-01`, "MMM yy"),
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
    const total = this.byCategory.reduce((sum, item) => sum + item.total, 0);
    return {
      isLoading: this.isLoading,
      isEmpty: !this.isLoading && this.byCategory.length === 0,
      sanity: { transactionCount, totalLabel: formatMoney(total, "ARS") },
      slices: this.byCategory.map((item, index) => this.sliceVM(item, index)),
    };
  }

  private sliceVM(item: CategoryStat, index: number): CategorySliceVM {
    return {
      key: item.categoryId ?? `uncategorized-${index}`,
      categoryId: item.categoryId,
      name: item.categoryName,
      movementsLabel: `${item.count} movimientos`,
      totalValue: item.total,
      totalLabel: formatMoney(item.total, "ARS"),
      color: COLORS[index % COLORS.length],
      href: item.categoryId
        ? `/wallet/transactions?type=expense&categoryId=${item.categoryId}`
        : null,
    };
  }
}
