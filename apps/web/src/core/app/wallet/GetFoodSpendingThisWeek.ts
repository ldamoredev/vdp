import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { WalletGateway } from "../../domain/wallet/WalletGateway";
import type { FoodSpendingThisWeek } from "../../domain/wallet/WalletStats";

export class GetFoodSpendingThisWeek extends Query<FoodSpendingThisWeek> {}

export class GetFoodSpendingThisWeekHandler
  implements RequestHandler<GetFoodSpendingThisWeek, FoodSpendingThisWeek>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<FoodSpendingThisWeek> {
    return this.gateway.getFoodSpendingThisWeek();
  }
}
