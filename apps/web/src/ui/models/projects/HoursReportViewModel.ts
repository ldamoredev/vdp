export interface HoursReportRowVM {
  key: string;
  projectOutcome: string;
  clientName: string | null;
  weekLabel: string;
  durationLabel: string;
  expectedIncomeLabel: string | null;
  registerIncomeHref: string | null;
}

export interface HoursReportIncomeTotalVM {
  currency: "ARS" | "USD";
  amountLabel: string;
}

export interface HoursReportViewModel {
  isLoading: boolean;
  error: string | null;
  fromDate: string;
  toDate: string;
  totalLabel: string;
  incomeTotals: HoursReportIncomeTotalVM[];
  rows: HoursReportRowVM[];
}
