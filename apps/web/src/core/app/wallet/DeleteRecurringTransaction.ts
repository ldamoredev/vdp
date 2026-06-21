import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class DeleteRecurringTransaction extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}

export class DeleteRecurringTransactionHandler
  implements RequestHandler<DeleteRecurringTransaction, void>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: DeleteRecurringTransaction): Promise<void> {
    return this.gateway.deleteRecurringTransaction(command.id);
  }
}
