import type { Client as ClientDto, ClientStatus } from "@vdp/shared";

export class Client {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly status: ClientStatus,
    readonly archivedAt: string | null,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static from(dto: ClientDto): Client {
    return new Client(dto.id, dto.name, dto.status, dto.archivedAt, dto.createdAt, dto.updatedAt);
  }

  get isActive(): boolean {
    return this.status === "active";
  }
}

export function sortClients(clients: readonly Client[]): Client[] {
  return [...clients].sort((left, right) => {
    if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}
