import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Transaction } from "../../domain/wallet/Transaction";
import type { UpdateTransactionInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class UpdateTransaction extends Command<Transaction> {
  constructor(
    readonly id: string,
    readonly input: UpdateTransactionInput,
  ) {
    super();
  }
}

export class UpdateTransactionHandler implements RequestHandler<UpdateTransaction, Transaction> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: UpdateTransaction): Promise<Transaction> {
    return this.gateway.updateTransaction(command.id, command.input);
  }
}
