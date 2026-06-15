import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class DeleteAccount extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}

export class DeleteAccountHandler implements RequestHandler<DeleteAccount, void> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: DeleteAccount): Promise<void> {
    await this.gateway.deleteAccount(command.id);
  }
}
