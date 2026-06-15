import type { Category as CategoryDto, CategoryType } from "@vdp/shared";

/**
 * A spending/income category. Plain data (reuses the wire shape). Labels and
 * icons rendering stay in the presenter.
 */
export type Category = CategoryDto;
export type { CategoryType };

/** Split categories into the two buckets the forms and pickers render. */
export function groupCategoriesByType(categories: readonly Category[]): {
  expense: Category[];
  income: Category[];
} {
  return {
    expense: categories.filter((category) => category.type === "expense"),
    income: categories.filter((category) => category.type === "income"),
  };
}
