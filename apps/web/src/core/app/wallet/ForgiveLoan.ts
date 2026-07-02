import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Loan } from "../../domain/wallet/Loan";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class ForgiveLoan extends Command<Loan> {
  constructor(readonly id: string) {
    super();
  }
}

export class ForgiveLoanHandler implements RequestHandler<ForgiveLoan, Loan> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: ForgiveLoan): Promise<Loan> {
    return this.gateway.forgiveLoan(command.id);
  }
}
