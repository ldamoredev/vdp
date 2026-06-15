export interface StatsViewModel {
  title: string;
  intro: string;
  monthlyTrend: MonthlyTrendVM;
  dollarRates: DollarRatesVM;
  byCategory: ByCategoryVM;
}

export interface MonthlyTrendVM {
  isLoading: boolean;
  isEmpty: boolean;
  bars: MonthlyTrendBarVM[];
}

export interface MonthlyTrendBarVM {
  label: string;
  income: number;
  expense: number;
}

export interface DollarRatesVM {
  isLoading: boolean;
  isEmpty: boolean;
  items: DollarRateVM[];
}

export interface DollarRateVM {
  id: string;
  typeLabel: string;
  dateLabel: string;
  rateLabel: string;
}

export interface ByCategoryVM {
  isLoading: boolean;
  isEmpty: boolean;
  sanity: { transactionCount: number; totalLabel: string };
  slices: CategorySliceVM[];
}

export interface CategorySliceVM {
  key: string;
  categoryId: string | null;
  name: string;
  movementsLabel: string;
  totalValue: number;
  totalLabel: string;
  color: string;
  /** Transactions deep-link, present only when the slice is a real category. */
  href: string | null;
}
