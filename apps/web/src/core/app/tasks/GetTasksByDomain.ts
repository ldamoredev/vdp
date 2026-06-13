import { Query, RequestHandler } from "@nbottarini/cqbus";
import type { DomainStat } from "@vdp/shared";

import type { TasksGateway } from "../../domain/tasks/TasksGateway";

export class GetTasksByDomain extends Query<DomainStat[]> {
  constructor(readonly params?: Record<string, string>) {
    super();
  }
}

export class GetTasksByDomainHandler implements RequestHandler<GetTasksByDomain, DomainStat[]> {
  constructor(private readonly gateway: TasksGateway) {}

  async handle(query: GetTasksByDomain): Promise<DomainStat[]> {
    return this.gateway.getByDomain(query.params);
  }
}
