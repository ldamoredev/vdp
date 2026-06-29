import { HttpClient } from "@nbottarini/abstract-http-client";
import type { Objective as ObjectiveDto } from "@vdp/shared";

import { Objective } from "../../domain/objectives/Objective";
import type {
  CreateObjectiveInput,
  ObjectivesGateway,
  UpdateObjectiveInput,
} from "../../domain/objectives/ObjectivesGateway";

const P = "/objectives";

export class HttpObjectivesGateway implements ObjectivesGateway {
  constructor(private readonly http: HttpClient) {}

  async listObjectives(): Promise<Objective[]> {
    const { body } = await this.http.get<{ objectives: ObjectiveDto[] }>(P);
    return body.objectives.map(Objective.from);
  }

  async getObjective(id: string): Promise<Objective | null> {
    const { body } = await this.http.get<ObjectiveDto | null>(`${P}/${id}`);
    return body ? Objective.from(body) : null;
  }

  async createObjective(input: CreateObjectiveInput): Promise<Objective> {
    const { body } = await this.http.post<ObjectiveDto>(P, input);
    return Objective.from(body);
  }

  async updateObjective(id: string, input: UpdateObjectiveInput): Promise<Objective> {
    const { body } = await this.http.put<ObjectiveDto>(`${P}/${id}`, input);
    return Objective.from(body);
  }

  async archiveObjective(id: string): Promise<Objective> {
    const { body } = await this.http.post<ObjectiveDto>(`${P}/${id}/archive`, {});
    return Objective.from(body);
  }
}
