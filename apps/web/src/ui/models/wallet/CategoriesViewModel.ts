import type { CategoryType } from "@/core/domain/wallet/Category";
import type { SelectOptionVM, WalletEmptyStateVM } from "./common";

export interface CategoriesViewModel {
  title: string;
  intro: string;
  addButtonLabel: string;
  form: CategoryFormVM | null;
  groups: CategoryGroupVM[] | null;
  emptyState: WalletEmptyStateVM | null;
  isLoading: boolean;
  error: boolean;
}

export type CategoryFormField = "name" | "type" | "icon";

export interface CategoryFormVM {
  name: string;
  type: CategoryType;
  icon: string;
  typeOptions: SelectOptionVM[];
  submitLabel: string;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface CategoryGroupVM {
  title: string;
  description: string;
  emptyText: string;
  items: CategoryItemVM[];
}

export interface CategoryItemVM {
  id: string;
  label: string;
}
