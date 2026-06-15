import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Transaction } from "../../domain/wallet/Transaction";
import type { CreateTransactionInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class CreateTransaction extends Command<Transaction> {
  constructor(readonly input: CreateTransactionInput) {
    super();
  }
}

export class CreateTransactionHandler implements RequestHandler<CreateTransaction, Transaction> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: CreateTransaction): Promise<Transaction> {
    return this.gateway.createTransaction(command.input);
  }
}
