import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { WalletTransactionFilters } from "../../domain/wallet/Transaction";
import type { TransactionList, WalletGateway } from "../../domain/wallet/WalletGateway";

export class GetTransactions extends Query<TransactionList> {
  constructor(readonly params?: Partial<WalletTransactionFilters>) {
    super();
  }
}

export class GetTransactionsHandler implements RequestHandler<GetTransactions, TransactionList> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(query: GetTransactions): Promise<TransactionList> {
    return this.gateway.getTransactions(query.params);
  }
}
