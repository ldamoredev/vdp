"use client";

import { Plus, Tags } from "lucide-react";
import { ModulePage } from "@/components/primitives/module-page";
import { StateCard } from "@/components/primitives/state-card";
import { useWalletActions, useWalletData } from "../use-wallet-context";
import { groupCategoriesByType } from "../wallet-selectors";

function CategorySection({
  title,
  description,
  categories,
}: {
  title: string;
  description: string;
  categories: Array<{ id: string; name: string; icon: string | null }>;
}) {
  return (
    <div className="glass-card-static p-5">
      <div className="mb-4">
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>

      {categories.length === 0 ? (
        <StateCard
          size="sm"
          className="border-none"
          title="Sin categorias"
          description="Todavia no registraste ninguna en este grupo"
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-sm"
            >
              <span className="font-medium">
                {category.icon ? `${category.icon} ` : ""}
                {category.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoriesScreen() {
  const {
    categories,
    showCategoryForm,
    categoryForm,
    isLoadingCategories,
    isCreatingCategory,
  } = useWalletData();
  const { toggleCategoryForm, setCategoryFormField, submitCategory } =
    useWalletActions();
  const grouped = groupCategoriesByType(categories);

  return (
    <ModulePage width="4xl" spacing="6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Categorias</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Define mejor tus ingresos y gastos para que el analisis sea util
          </p>
        </div>
        <button onClick={toggleCategoryForm} className="btn-primary">
          <Plus size={16} />
          Nueva categoria
        </button>
      </div>

      {showCategoryForm && (
        <div className="glass-card-static animate-fade-in-up p-5">
          <h3 className="mb-4 text-sm font-semibold">Crear categoria</h3>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitCategory();
            }}
          >
            <input
              value={categoryForm.name}
              onChange={(event) => setCategoryFormField("name", event.target.value)}
              placeholder="Ej: Supermercado, Sueldo, Transporte"
              className="glass-input w-full px-4 py-2.5 text-sm"
              required
            />

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <select
                value={categoryForm.type}
                onChange={(event) => setCategoryFormField("type", event.target.value)}
                className="glass-input px-4 py-2.5 text-sm"
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>

              <input
                value={categoryForm.icon}
                onChange={(event) => setCategoryFormField("icon", event.target.value)}
                placeholder="Icono opcional, ej: 🛒 o 💼"
                className="glass-input px-4 py-2.5 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreatingCategory}
              >
                {isCreatingCategory ? "Creando..." : "Guardar categoria"}
              </button>
              <button
                type="button"
                onClick={toggleCategoryForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoadingCategories ? (
        <StateCard
          size="lg"
          className="glass-card-static border-none"
          description="Cargando categorias..."
        />
      ) : categories.length === 0 ? (
        <StateCard
          size="lg"
          className="glass-card-static border-none"
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hover-overlay)]">
              <Tags size={24} className="text-[var(--muted)]" />
            </div>
          }
          title="No hay categorias personalizadas"
          description="Crea categorias para darle mas precision a los movimientos y a las estadisticas"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 stagger-children">
          <CategorySection
            title="Gastos"
            description="Categorias que ordenan salidas de dinero"
            categories={grouped.expense}
          />
          <CategorySection
            title="Ingresos"
            description="Categorias que separan entradas de dinero"
            categories={grouped.income}
          />
        </div>
      )}
    </ModulePage>
  );
}
