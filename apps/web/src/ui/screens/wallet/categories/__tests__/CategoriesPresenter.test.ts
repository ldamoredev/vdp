import type { Category } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { CategoriesPresenter } from "../CategoriesPresenter";

function category(overrides: Partial<Category> = {}): Category {
  return { id: "c1", name: "Comida", type: "expense", icon: null, ...overrides };
}

function build(categories: Category[] = [category()]) {
  const gateway = new FakeWalletGateway();
  const getCategories = vi.spyOn(gateway, "getCategories").mockResolvedValue(categories);
  const createCategory = vi.spyOn(gateway, "createCategory");
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
  const presenter = new CategoriesPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway, getCategories, createCategory };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("CategoriesPresenter", () => {
  it("loads categories and groups them into expense/income sections", async () => {
    const { presenter } = build([
      category({ id: "e", name: "Comida", type: "expense", icon: "🍔" }),
      category({ id: "i", name: "Sueldo", type: "income" }),
    ]);

    presenter.start();
    await flush();

    expect(presenter.model.groups).toHaveLength(2);
    expect(presenter.model.groups?.[0].items.map((c) => c.label)).toEqual(["🍔 Comida"]);
    expect(presenter.model.groups?.[1].items.map((c) => c.label)).toEqual(["Sueldo"]);
  });

  it("shows the empty state when there are no categories", async () => {
    const { presenter } = build([]);

    presenter.start();
    await flush();

    expect(presenter.model.emptyState?.title).toBe("Todavía no hay categorías");
    expect(presenter.model.groups).toBeNull();
  });

  it("toggles the create form and validates the name", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    expect(presenter.model.form).toBeNull();
    presenter.toggleForm();
    expect(presenter.model.form?.canSubmit).toBe(false);

    presenter.setFormField("name", "Transporte");
    presenter.setFormField("type", "income");
    expect(presenter.model.form?.type).toBe("income");
    expect(presenter.model.form?.canSubmit).toBe(true);
  });

  it("creates a category, nulling an empty icon and resetting the form", async () => {
    const { presenter, createCategory } = build();
    presenter.start();
    await flush();
    presenter.toggleForm();
    presenter.setFormField("name", "  Transporte  ");

    await presenter.submit();

    expect(createCategory).toHaveBeenCalledWith({ name: "Transporte", type: "expense", icon: null });
    expect(presenter.model.form).toBeNull();
  });

  it("passes a trimmed icon through when provided", async () => {
    const { presenter, createCategory } = build();
    presenter.start();
    await flush();
    presenter.toggleForm();
    presenter.setFormField("name", "Comida");
    presenter.setFormField("icon", " 🍔 ");

    await presenter.submit();

    expect(createCategory).toHaveBeenCalledWith({ name: "Comida", type: "expense", icon: "🍔" });
  });

  it("does not submit an empty name", async () => {
    const { presenter, createCategory } = build();
    presenter.start();
    await flush();
    presenter.toggleForm();

    await presenter.submit();

    expect(createCategory).not.toHaveBeenCalled();
  });
});
