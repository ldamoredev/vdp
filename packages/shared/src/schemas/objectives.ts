import { z } from "zod";
import { idParamsSchema, localDateStringSchema } from "./common";

export const objectiveMetricSourceEnum = z.enum(["manual", "projects_hours"]);
export const objectiveStatusEnum = z.enum(["active", "archived", "achieved"]);
export const objectiveIdParamsSchema = idParamsSchema;

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
  target: positiveMetricSchema,
  unit: z.string().min(1).max(24),
  manualValue: nonNegativeMetricSchema.nullable().optional(),
});

export const createObjectiveSchema = objectiveInputSchema.refine((value) => value.periodEnd >= value.periodStart, {
  message: "Period end must be on or after period start",
  path: ["periodEnd"],
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
  });
