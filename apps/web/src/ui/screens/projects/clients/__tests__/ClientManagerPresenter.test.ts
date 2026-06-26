import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { ProjectsModule } from "@/core/app/projects/ProjectsModule";
import { FakeProjectsGateway } from "@/core/app/projects/__tests__/fakes/FakeProjectsGateway";
import { ClientManagerPresenter } from "../ClientManagerPresenter";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function coreWith(gateway: FakeProjectsGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new ProjectsModule(gateway));
}

describe("ClientManagerPresenter", () => {
  it("loads the catalog and exposes saved names as controlled drafts", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new ClientManagerPresenter(vi.fn(), coreWith(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    expect(presenter.model.clients).toEqual([
      expect.objectContaining({ id: "c1", draftName: "Acme", isActive: true }),
    ]);
  });

  it("creates a client and notifies listeners so dependent selectors refresh", async () => {
    const gateway = new FakeProjectsGateway();
    const onChanged = vi.fn();
    const presenter = new ClientManagerPresenter(vi.fn(), coreWith(gateway), onChanged);
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.setNewName("Globex");
    await presenter.createClient();

    expect(gateway.callsTo("createClient")[0].args[0]).toEqual({ name: "Globex" });
    expect(presenter.model.newName).toBe("");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("renames only when the draft actually changes", async () => {
    const gateway = new FakeProjectsGateway();
    const presenter = new ClientManagerPresenter(vi.fn(), coreWith(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.setDraftName("c1", "Acme"); // unchanged
    await presenter.renameClient("c1");
    presenter.setDraftName("c1", "Acme Corp");
    await presenter.renameClient("c1");

    expect(gateway.callsTo("updateClient")).toHaveLength(1);
    expect(gateway.callsTo("updateClient")[0].args).toEqual(["c1", { name: "Acme Corp" }]);
  });

  it("reverts the draft to the saved name when a rename fails", async () => {
    const gateway = new FakeProjectsGateway();
    vi.spyOn(gateway, "updateClient").mockRejectedValueOnce(new Error("boom"));
    const presenter = new ClientManagerPresenter(vi.fn(), coreWith(gateway));
    presenter.init(undefined);
    presenter.start();
    await flush();

    presenter.setDraftName("c1", "Broken Name");
    await presenter.renameClient("c1");

    expect(presenter.model.clients[0].draftName).toBe("Acme"); // reverted
    expect(presenter.model.error).toMatch(/renombrar/i);
  });

  it("archives a client through the gateway and notifies listeners", async () => {
    const gateway = new FakeProjectsGateway();
    const onChanged = vi.fn();
    const presenter = new ClientManagerPresenter(vi.fn(), coreWith(gateway), onChanged);
    presenter.init(undefined);
    presenter.start();
    await flush();

    await presenter.archiveClient("c1");

    expect(gateway.callsTo("archiveClient")[0].args).toEqual(["c1"]);
    expect(onChanged).toHaveBeenCalledTimes(1);
  });
});
