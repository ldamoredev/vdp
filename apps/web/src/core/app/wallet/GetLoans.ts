import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Loan } from "../../domain/wallet/Loan";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class GetLoans extends Query<Loan[]> {}

export class GetLoansHandler implements RequestHandler<GetLoans, Loan[]> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<Loan[]> {
    return this.gateway.getLoans();
  }
}
