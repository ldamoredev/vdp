import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const dateStringSchema = z.string();
export const optionalDateStringSchema = dateStringSchema.optional();
export const nullableDateStringSchema = dateStringSchema.nullable().optional();

/**
 * Validates a calendar date in strict local `YYYY-MM-DD` format.
 *
 * Date strings drive day-based grouping, carry-over, and history. A malformed
 * value (e.g. `"tomorrow"`, `"2026-13-99"`, `"2026-02-31"`) stored verbatim
 * silently breaks those flows, so reject anything that is not a real calendar
 * day in this exact format.
 */
function isValidLocalDateISO(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const localDateStringSchema = z
  .string()
  .refine(isValidLocalDateISO, { message: "Invalid date, expected YYYY-MM-DD" });
export const optionalLocalDateStringSchema = localDateStringSchema.optional();

export const localDateRangeSchema = z.object({
  from: optionalLocalDateStringSchema,
  to: optionalLocalDateStringSchema,
});

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
