import type { Account as AccountDto, AccountType } from "@vdp/shared";

/**
 * A wallet account. Plain data (reuses the wire shape). Spanish type labels
 * (Efectivo/Banco/…) are presentation and live in the presenter.
 */
export type Account = AccountDto;
export type { AccountType };
