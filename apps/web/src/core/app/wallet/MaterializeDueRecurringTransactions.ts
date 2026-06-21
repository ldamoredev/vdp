import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { WalletGateway } from "../../domain/wallet/WalletGateway";

/** Returns how many transactions were materialized. Dispatched on wallet load. */
export class MaterializeDueRecurringTransactions extends Command<number> {}

export class MaterializeDueRecurringTransactionsHandler
  implements RequestHandler<MaterializeDueRecurringTransactions, number>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<number> {
    return this.gateway.materializeDueRecurringTransactions();
  }
}
