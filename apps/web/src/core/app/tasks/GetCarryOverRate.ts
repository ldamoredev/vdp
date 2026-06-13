import { Query, RequestHandler } from "@nbottarini/cqbus";
import type { CarryOverRateResponse } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class GetCarryOverRate extends Query<CarryOverRateResponse> {
  constructor(readonly days?: number) {
    super();
  }
}

export class GetCarryOverRateHandler implements RequestHandler<GetCarryOverRate, CarryOverRateResponse> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: GetCarryOverRate): Promise<CarryOverRateResponse> {
    return this.gateway.getCarryOverRate(query.days);
  }
}
