import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const dateStringSchema = z.string();
export const optionalDateStringSchema = dateStringSchema.optional();
export const nullableDateStringSchema = dateStringSchema.nullable().optional();

export const idParamsSchema = z.object({
  id: uuidSchema,
});

export const dateRangeSchema = z.object({
  from: optionalDateStringSchema,
  to: optionalDateStringSchema,
});

export const daysWindowSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});
