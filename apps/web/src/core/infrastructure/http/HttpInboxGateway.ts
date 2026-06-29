import { HttpClient } from "@nbottarini/abstract-http-client";
import type { InboxItem as InboxItemDto } from "@vdp/shared";

import { InboxItem } from "../../domain/inbox/InboxItem";
import type { CaptureInboxItemInput, InboxGateway } from "../../domain/inbox/InboxGateway";

const P = "/inbox";

export class HttpInboxGateway implements InboxGateway {
  constructor(private readonly http: HttpClient) {}

  async listItems(): Promise<InboxItem[]> {
    const { body } = await this.http.get<{ items: InboxItemDto[] }>(P);
    return body.items.map(InboxItem.from);
  }

  async captureItem(input: CaptureInboxItemInput): Promise<InboxItem> {
    const { body } = await this.http.post<InboxItemDto>(P, input);
    return InboxItem.from(body);
  }

  async triageItem(id: string, routedTo: string): Promise<InboxItem> {
    const { body } = await this.http.post<InboxItemDto>(`${P}/${id}/triage`, { routedTo });
    return InboxItem.from(body);
  }

  async discardItem(id: string): Promise<InboxItem> {
    const { body } = await this.http.post<InboxItemDto>(`${P}/${id}/discard`, {});
    return InboxItem.from(body);
  }
}
