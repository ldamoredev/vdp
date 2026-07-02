import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Loan } from "../../domain/wallet/Loan";
import type { CreateLoanInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class CreateLoan extends Command<Loan> {
  constructor(readonly input: CreateLoanInput) {
    super();
  }
}

export class CreateLoanHandler implements RequestHandler<CreateLoan, Loan> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: CreateLoan): Promise<Loan> {
    return this.gateway.createLoan(command.input);
  }
}
