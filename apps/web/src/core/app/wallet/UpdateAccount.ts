import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Account } from "../../domain/wallet/Account";
import type { UpdateAccountInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class UpdateAccount extends Command<Account> {
  constructor(
    readonly id: string,
    readonly input: UpdateAccountInput,
  ) {
    super();
  }
}

export class UpdateAccountHandler implements RequestHandler<UpdateAccount, Account> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: UpdateAccount): Promise<Account> {
    return this.gateway.updateAccount(command.id, command.input);
  }
}
