import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class DeleteTransaction extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}

export class DeleteTransactionHandler implements RequestHandler<DeleteTransaction, void> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: DeleteTransaction): Promise<void> {
    await this.gateway.deleteTransaction(command.id);
  }
}
