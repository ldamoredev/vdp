import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { SavingsGoal } from "../../domain/wallet/SavingsGoal";
import type { CreateSavingsGoalInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class CreateSavingsGoal extends Command<SavingsGoal> {
  constructor(readonly input: CreateSavingsGoalInput) {
    super();
  }
}

export class CreateSavingsGoalHandler implements RequestHandler<CreateSavingsGoal, SavingsGoal> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: CreateSavingsGoal): Promise<SavingsGoal> {
    return this.gateway.createSavingsGoal(command.input);
  }
}
