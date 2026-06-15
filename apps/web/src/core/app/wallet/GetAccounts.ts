import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Account } from "../../domain/wallet/Account";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class GetAccounts extends Query<Account[]> {}

export class GetAccountsHandler implements RequestHandler<GetAccounts, Account[]> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<Account[]> {
    return this.gateway.getAccounts();
  }
}
