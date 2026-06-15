import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Investment } from "../../domain/wallet/Investment";
import type { CreateInvestmentInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class CreateInvestment extends Command<Investment> {
  constructor(readonly input: CreateInvestmentInput) {
    super();
  }
}

export class CreateInvestmentHandler implements RequestHandler<CreateInvestment, Investment> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: CreateInvestment): Promise<Investment> {
    return this.gateway.createInvestment(command.input);
  }
}
