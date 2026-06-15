import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { SavingsGoal } from "../../domain/wallet/SavingsGoal";
import type { ContributeSavingsInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class ContributeSavings extends Command<SavingsGoal> {
  constructor(
    readonly id: string,
    readonly input: ContributeSavingsInput,
  ) {
    super();
  }
}

export class ContributeSavingsHandler implements RequestHandler<ContributeSavings, SavingsGoal> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: ContributeSavings): Promise<SavingsGoal> {
    return this.gateway.contributeSavings(command.id, command.input);
  }
}
