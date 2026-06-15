import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { SavingsGoal } from "../../domain/wallet/SavingsGoal";
import type { UpdateSavingsGoalInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class UpdateSavingsGoal extends Command<SavingsGoal> {
  constructor(
    readonly id: string,
    readonly input: UpdateSavingsGoalInput,
  ) {
    super();
  }
}

export class UpdateSavingsGoalHandler implements RequestHandler<UpdateSavingsGoal, SavingsGoal> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: UpdateSavingsGoal): Promise<SavingsGoal> {
    return this.gateway.updateSavingsGoal(command.id, command.input);
  }
}
