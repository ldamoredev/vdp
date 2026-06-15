import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { SavingsGoal } from "../../domain/wallet/SavingsGoal";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class GetSavings extends Query<SavingsGoal[]> {}

export class GetSavingsHandler implements RequestHandler<GetSavings, SavingsGoal[]> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<SavingsGoal[]> {
    return this.gateway.getSavings();
  }
}
