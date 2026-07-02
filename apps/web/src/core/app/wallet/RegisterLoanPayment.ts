import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Loan } from "../../domain/wallet/Loan";
import type { RegisterLoanPaymentInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class RegisterLoanPayment extends Command<Loan> {
  constructor(
    readonly id: string,
    readonly input: RegisterLoanPaymentInput,
  ) {
    super();
  }
}

export class RegisterLoanPaymentHandler implements RequestHandler<RegisterLoanPayment, Loan> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: RegisterLoanPayment): Promise<Loan> {
    return this.gateway.registerLoanPayment(command.id, command.input);
  }
}
