import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { CreateCategory } from "@/core/app/wallet/CreateCategory";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import {
  type Category,
  type CategoryType,
  groupCategoriesByType,
} from "@/core/domain/wallet/Category";
import type {
  CategoriesViewModel,
  CategoryFormField,
  CategoryGroupVM,
  CategoryItemVM,
} from "@/ui/models/wallet/CategoriesViewModel";
import { walletEmptyState, walletScreenIntro } from "../wallet-copy";

interface CategoryFormState {
  name: string;
  type: CategoryType;
  icon: string;
}

const TYPE_OPTIONS = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
];

function emptyForm(): CategoryFormState {
  return { name: "", type: "expense", icon: "" };
}

/**
 * Drives the categories screen: loads the categories, groups them into
 * expense/income sections and owns the create form. Mutations go through the
 * Core bus and reload the list. Spanish copy lives here; the view is humble.
 */
export class CategoriesPresenter extends PresenterBase<CategoriesViewModel> {
  private categories: Category[] = [];
  private isLoading = true;
  private error = false;

  private showForm = false;
  private form: CategoryFormState = emptyForm();
  private isCreating = false;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): CategoriesViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  stop(): void {}

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.form = emptyForm();
    this.refresh();
  }

  setFormField(field: CategoryFormField, value: string): void {
    if (field === "type") this.form.type = value as CategoryType;
    else this.form[field] = value;
    this.refresh();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.isCreating = true;
    this.refresh();
    try {
      await this.core.execute(
        new CreateCategory({
          name: this.form.name.trim(),
          type: this.form.type,
          icon: this.form.icon.trim() || null,
        }),
      );
      this.showForm = false;
      this.form = emptyForm();
      await this.load();
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      this.categories = await this.core.execute(new GetCategories());
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private canSubmit(): boolean {
    return this.form.name.trim().length > 0 && !this.isCreating;
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): CategoriesViewModel {
    const grouped = groupCategoriesByType(this.categories);
    const hasCategories = this.categories.length > 0;

    return {
      title: "Categorías",
      intro: walletScreenIntro("categories"),
      addButtonLabel: "Nueva categoría",
      form: this.showForm
        ? {
            name: this.form.name,
            type: this.form.type,
            icon: this.form.icon,
            typeOptions: TYPE_OPTIONS,
            submitLabel: this.isCreating ? "Creando..." : "Guardar categoría",
            isSubmitting: this.isCreating,
            canSubmit: this.canSubmit(),
          }
        : null,
      groups:
        !this.isLoading && hasCategories
          ? [
              this.groupVM("Gastos", "Categorías que ordenan salidas de dinero", grouped.expense),
              this.groupVM("Ingresos", "Categorías que separan entradas de dinero", grouped.income),
            ]
          : null,
      emptyState: !this.isLoading && !hasCategories ? walletEmptyState("categories") : null,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private groupVM(title: string, description: string, categories: Category[]): CategoryGroupVM {
    return {
      title,
      description,
      emptyText: "Todavía no registraste ninguna en este grupo",
      items: categories.map((category) => this.categoryVM(category)),
    };
  }

  private categoryVM(category: Category): CategoryItemVM {
    return {
      id: category.id,
      label: category.icon ? `${category.icon} ${category.name}` : category.name,
    };
  }
}
