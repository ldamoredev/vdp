import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Investment } from "../../domain/wallet/Investment";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class GetInvestments extends Query<Investment[]> {}

export class GetInvestmentsHandler implements RequestHandler<GetInvestments, Investment[]> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<Investment[]> {
    return this.gateway.getInvestments();
  }
}
