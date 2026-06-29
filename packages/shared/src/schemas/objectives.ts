import { z } from "zod";
import { idParamsSchema, localDateStringSchema } from "./common";

export const objectiveMetricSourceEnum = z.enum([
  "manual",
  "projects_hours",
  "tasks_completed",
  "wallet_savings",
  "health_habit_completions",
]);
export const objectiveStatusEnum = z.enum(["active", "archived", "achieved"]);
export const objectiveCurrencyEnum = z.enum(["ARS", "USD"]);
export const objectiveIdParamsSchema = idParamsSchema;

const CURRENCY_SCOPED_SOURCES: readonly z.infer<typeof objectiveMetricSourceEnum>[] = ["wallet_savings"];
const TARGETED_SOURCES: readonly z.infer<typeof objectiveMetricSourceEnum>[] = ["health_habit_completions"];

function isCurrencyScopedSource(source: z.infer<typeof objectiveMetricSourceEnum>): boolean {
  return CURRENCY_SCOPED_SOURCES.includes(source);
}

function isTargetedSource(source: z.infer<typeof objectiveMetricSourceEnum>): boolean {
  return TARGETED_SOURCES.includes(source);
}

const numericMetricSchema = z.union([
  z.number(),
  z.string().min(1).transform((value) => Number(value)),
]).refine((value) => Number.isFinite(value), "Value must be numeric");

const positiveMetricSchema = numericMetricSchema.refine((value) => value > 0, "Target must be positive");
const nonNegativeMetricSchema = numericMetricSchema.refine((value) => value >= 0, "Value must be non-negative");

const objectiveInputSchema = z.object({
  title: z.string().min(1).max(180),
  periodStart: localDateStringSchema,
  periodEnd: localDateStringSchema,
  metricSource: objectiveMetricSourceEnum,
  metricTargetId: z.string().min(1).max(120).nullable().optional(),
  target: positiveMetricSchema,
  unit: z.string().min(1).max(24),
  manualValue: nonNegativeMetricSchema.nullable().optional(),
  currency: objectiveCurrencyEnum.nullable().optional(),
});

export const createObjectiveSchema = objectiveInputSchema
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "Period end must be on or after period start",
    path: ["periodEnd"],
  })
  .refine((value) => !isCurrencyScopedSource(value.metricSource) || value.currency != null, {
    message: "Currency is required for this metric source",
    path: ["currency"],
  })
  .refine((value) => !isTargetedSource(value.metricSource) || value.metricTargetId != null, {
    message: "Metric target is required for this metric source",
    path: ["metricTargetId"],
  });

export const updateObjectiveSchema = objectiveInputSchema.partial().strict()
  .refine((value) => (value.periodStart === undefined) === (value.periodEnd === undefined), {
    message: "Period start and end must be updated together",
    path: ["periodEnd"],
  })
  .refine((value) => {
    if (value.periodStart === undefined || value.periodEnd === undefined) return true;
    return value.periodEnd >= value.periodStart;
  }, {
    message: "Period end must be on or after period start",
    path: ["periodEnd"],
  })
  .refine((value) => {
    if (value.metricSource === undefined || !isCurrencyScopedSource(value.metricSource)) return true;
    return value.currency != null;
  }, {
    message: "Currency is required for this metric source",
    path: ["currency"],
  })
  .refine((value) => {
    if (value.metricSource === undefined || !isTargetedSource(value.metricSource)) return true;
    return value.metricTargetId != null;
  }, {
    message: "Metric target is required for this metric source",
    path: ["metricTargetId"],
  });
