import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Account } from "../../domain/wallet/Account";
import type { CreateAccountInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class CreateAccount extends Command<Account> {
  constructor(readonly input: CreateAccountInput) {
    super();
  }
}

export class CreateAccountHandler implements RequestHandler<CreateAccount, Account> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: CreateAccount): Promise<Account> {
    return this.gateway.createAccount(command.input);
  }
}
