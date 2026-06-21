import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { RecurringTransaction } from "../../domain/wallet/RecurringTransaction";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class GetRecurringTransactions extends Query<RecurringTransaction[]> {}

export class GetRecurringTransactionsHandler
  implements RequestHandler<GetRecurringTransactions, RecurringTransaction[]>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<RecurringTransaction[]> {
    return this.gateway.getRecurringTransactions();
  }
}
