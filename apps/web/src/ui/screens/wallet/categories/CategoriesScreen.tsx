import { Plus } from "lucide-react";

import { ModulePage } from "@/components/primitives/module-page";
import { StateCard } from "@/components/primitives/state-card";
import type { CategoryFormVM, CategoryGroupVM } from "@/ui/models/wallet/CategoriesViewModel";
import { WalletEmptyState } from "../components/wallet-empty-state";
import { useCategoriesPresenter } from "./useCategoriesPresenter";

export function CategoriesScreen() {
  const presenter = useCategoriesPresenter();
  const vm = presenter.model;

  return (
    <ModulePage width="4xl" spacing="6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{vm.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{vm.intro}</p>
        </div>
        <button onClick={() => presenter.toggleForm()} className="btn-primary">
          <Plus size={16} />
          {vm.addButtonLabel}
        </button>
      </div>

      {vm.form && <CategoryForm vm={vm.form} presenter={presenter} />}

      {vm.isLoading ? (
        <StateCard size="lg" className="glass-card-static border-none" description="Cargando categorias..." />
      ) : vm.emptyState ? (
        <div className="glass-card-static border-none">
          <WalletEmptyState {...vm.emptyState} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
          {vm.groups?.map((group) => <CategorySection key={group.title} vm={group} />)}
        </div>
      )}
    </ModulePage>
  );
}

function CategoryForm({
  vm,
  presenter,
}: {
  vm: CategoryFormVM;
  presenter: ReturnType<typeof useCategoriesPresenter>;
}) {
  return (
    <div className="glass-card-static animate-fade-in-up p-5">
      <h3 className="mb-4 text-sm font-semibold">Crear categoria</h3>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void presenter.submit();
        }}
      >
        <input
          value={vm.name}
          onChange={(event) => presenter.setFormField("name", event.target.value)}
          placeholder="Ej: Supermercado, Sueldo, Transporte"
          className="glass-input w-full px-4 py-2.5 text-sm"
          required
        />

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <select
            value={vm.type}
            onChange={(event) => presenter.setFormField("type", event.target.value)}
            className="glass-input px-4 py-2.5 text-sm"
          >
            {vm.typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            value={vm.icon}
            onChange={(event) => presenter.setFormField("icon", event.target.value)}
            placeholder="Icono opcional, ej: 🛒 o 💼"
            className="glass-input px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={!vm.canSubmit}>
            {vm.submitLabel}
          </button>
          <button type="button" onClick={() => presenter.toggleForm()} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function CategorySection({ vm }: { vm: CategoryGroupVM }) {
  return (
    <div className="glass-card-static p-5">
      <div className="mb-4">
        <h3 className="font-medium">{vm.title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{vm.description}</p>
      </div>

      {vm.items.length === 0 ? (
        <StateCard size="sm" className="border-none" title="Sin categorias" description={vm.emptyText} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {vm.items.map((category) => (
            <div
              key={category.id}
              className="rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-sm"
            >
              <span className="font-medium">{category.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
