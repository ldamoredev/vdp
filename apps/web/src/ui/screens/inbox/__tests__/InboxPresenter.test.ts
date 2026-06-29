import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { InboxModule } from "@/core/app/inbox/InboxModule";
import { FakeInboxGateway } from "@/core/app/inbox/__tests__/fakes/FakeInboxGateway";
import { InboxPresenter } from "../InboxPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(gateway: FakeInboxGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new InboxModule(gateway));
}

async function mountedPresenter(gateway: FakeInboxGateway): Promise<InboxPresenter> {
  const presenter = new InboxPresenter(vi.fn(), coreWith(gateway));
  presenter.init(undefined);
  presenter.start();
  await flush();
  return presenter;
}

describe("InboxPresenter", () => {
  it("lists only pending items with a captured label", async () => {
    const gateway = new FakeInboxGateway();
    gateway.items = [];
    await gateway.captureItem({ text: "Pendiente" });
    const discarded = await gateway.captureItem({ text: "Ya descartado" });
    await gateway.discardItem(discarded.id);

    const presenter = await mountedPresenter(gateway);

    expect(presenter.model.pendingCount).toBe(1);
    expect(presenter.model.items.map((item) => item.text)).toEqual(["Pendiente"]);
    expect(presenter.model.items[0].capturedLabel).toBeTruthy();
  });

  it("captures the draft, clears it and reloads", async () => {
    const gateway = new FakeInboxGateway();
    gateway.items = [];
    const presenter = await mountedPresenter(gateway);

    presenter.setDraft("  Comprar café  ");
    expect(presenter.model.canSubmit).toBe(true);
    await presenter.capture();

    expect(gateway.callsTo("captureItem")[0].args).toEqual([{ text: "Comprar café" }]);
    expect(presenter.model.draft).toBe("");
    expect(presenter.model.items.map((item) => item.text)).toContain("Comprar café");
  });

  it("does not submit an empty draft", async () => {
    const gateway = new FakeInboxGateway();
    const presenter = await mountedPresenter(gateway);

    presenter.setDraft("   ");
    expect(presenter.model.canSubmit).toBe(false);
    await presenter.capture();

    expect(gateway.callsTo("captureItem")).toHaveLength(0);
  });

  it("exposes triage targets with prefilled deep-links", async () => {
    const gateway = new FakeInboxGateway();
    gateway.items = [];
    await gateway.captureItem({ text: "Pagar la luz" });
    const presenter = await mountedPresenter(gateway);

    const targets = presenter.model.items[0].triageTargets;
    expect(targets.map((t) => t.routedTo)).toEqual(["tasks", "wallet"]);
    expect(targets.find((t) => t.routedTo === "tasks")?.href).toBe("/tasks?capturar=Pagar%20la%20luz");
    expect(targets.find((t) => t.routedTo === "wallet")?.href).toBe(
      "/wallet/transactions/new?type=expense&description=Pagar%20la%20luz",
    );
  });

  it("triages an item and removes it from the pending queue", async () => {
    const gateway = new FakeInboxGateway();
    gateway.items = [];
    const captured = await gateway.captureItem({ text: "Pagar la luz" });
    const presenter = await mountedPresenter(gateway);

    await presenter.triage(captured.id, "wallet");

    expect(gateway.callsTo("triageItem")[0].args).toEqual([captured.id, "wallet"]);
    expect(presenter.model.pendingCount).toBe(0);
  });

  it("discards an item through the gateway", async () => {
    const gateway = new FakeInboxGateway();
    gateway.items = [];
    const captured = await gateway.captureItem({ text: "Algo" });
    const presenter = await mountedPresenter(gateway);

    await presenter.discard(captured.id);

    expect(gateway.callsTo("discardItem")[0].args).toEqual([captured.id]);
    expect(presenter.model.pendingCount).toBe(0);
  });
});
