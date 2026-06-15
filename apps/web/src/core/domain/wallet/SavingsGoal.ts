import type { SavingsGoal as SavingsGoalDto, Currency } from "@vdp/shared";

/**
 * A savings goal. Rich model: it owns the progress computation the views read
 * off raw amounts. Mutations go through the gateway, so the model is read-only.
 * Spanish copy stays in the presenter.
 */
export class SavingsGoal {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly targetAmount: string,
    readonly currentAmount: string,
    readonly currency: Currency,
    readonly deadline: string | null,
    readonly isCompleted: boolean,
    readonly createdAt: string,
    readonly updatedAt: string | undefined,
  ) {}

  static from(dto: SavingsGoalDto): SavingsGoal {
    return new SavingsGoal(
      dto.id,
      dto.name,
      dto.targetAmount,
      dto.currentAmount,
      dto.currency,
      dto.deadline,
      dto.isCompleted,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  get current(): number {
    return Number(this.currentAmount);
  }

  get target(): number {
    return Number(this.targetAmount);
  }

  /** Percentage toward the target, clamped to [0, 100]. 0 when target is non-positive. */
  get progress(): number {
    return this.target > 0 ? Math.min((this.current / this.target) * 100, 100) : 0;
  }
}
