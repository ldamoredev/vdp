import { Command, RequestHandler } from "@nbottarini/cqbus";
import type { CarryOverAllResult } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class CarryOverAll extends Command<CarryOverAllResult> {
  constructor(readonly fromDate: string, readonly toDate?: string) {
    super();
  }
}

export class CarryOverAllHandler implements RequestHandler<CarryOverAll, CarryOverAllResult> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(command: CarryOverAll): Promise<CarryOverAllResult> {
    return this.gateway.carryOverAll(command.fromDate, command.toDate);
  }
}
