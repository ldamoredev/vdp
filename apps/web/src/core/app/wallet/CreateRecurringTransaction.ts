import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { RecurringTransaction } from "../../domain/wallet/RecurringTransaction";
import type { CreateRecurringTransactionInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class CreateRecurringTransaction extends Command<RecurringTransaction> {
  constructor(readonly input: CreateRecurringTransactionInput) {
    super();
  }
}

export class CreateRecurringTransactionHandler
  implements RequestHandler<CreateRecurringTransaction, RecurringTransaction>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: CreateRecurringTransaction): Promise<RecurringTransaction> {
    return this.gateway.createRecurringTransaction(command.input);
  }
}
