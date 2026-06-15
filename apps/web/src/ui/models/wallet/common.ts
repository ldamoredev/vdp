/** View-model fragments shared across the wallet screens. */

export interface SelectOptionVM {
  value: string;
  label: string;
}

export interface WalletEmptyStateVM {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}
