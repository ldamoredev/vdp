import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Loan } from "../../domain/wallet/Loan";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class MarkLoanRepaid extends Command<Loan> {
  constructor(readonly id: string) {
    super();
  }
}

export class MarkLoanRepaidHandler implements RequestHandler<MarkLoanRepaid, Loan> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: MarkLoanRepaid): Promise<Loan> {
    return this.gateway.markLoanRepaid(command.id);
  }
}
