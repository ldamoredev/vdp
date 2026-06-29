import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { InboxItem } from "@/core/domain/inbox/InboxItem";
import { CaptureInboxItem } from "../CaptureInboxItem";
import { DiscardInboxItem } from "../DiscardInboxItem";
import { InboxModule } from "../InboxModule";
import { ListInboxItems } from "../ListInboxItems";
import { TriageInboxItem } from "../TriageInboxItem";
import { FakeInboxGateway } from "./fakes/FakeInboxGateway";

function coreWith(gateway: FakeInboxGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new InboxModule(gateway));
}

describe("inbox handlers (dispatched through the bus)", () => {
  it("routes list through the gateway and returns domain models", async () => {
    const gateway = new FakeInboxGateway();
    const core = coreWith(gateway);

    const items = await core.execute(new ListInboxItems());

    expect(gateway.callsTo("listItems")).toHaveLength(1);
    expect(items[0]).toBeInstanceOf(InboxItem);
  });

  it("routes capture and discard commands", async () => {
    const gateway = new FakeInboxGateway();
    const core = coreWith(gateway);

    const captured = await core.execute(new CaptureInboxItem({ text: "Comprar pan" }));
    await core.execute(new TriageInboxItem(captured.id, "tasks"));
    await core.execute(new DiscardInboxItem(captured.id));

    expect(gateway.callsTo("captureItem")[0].args).toEqual([{ text: "Comprar pan" }]);
    expect(gateway.callsTo("triageItem")[0].args).toEqual([captured.id, "tasks"]);
    expect(gateway.callsTo("discardItem")[0].args).toEqual([captured.id]);
    expect(captured).toBeInstanceOf(InboxItem);
  });
});
