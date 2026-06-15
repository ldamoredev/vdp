import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Investment } from "../../domain/wallet/Investment";
import type { UpdateInvestmentInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class UpdateInvestment extends Command<Investment> {
  constructor(
    readonly id: string,
    readonly input: UpdateInvestmentInput,
  ) {
    super();
  }
}

export class UpdateInvestmentHandler implements RequestHandler<UpdateInvestment, Investment> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: UpdateInvestment): Promise<Investment> {
    return this.gateway.updateInvestment(command.id, command.input);
  }
}
