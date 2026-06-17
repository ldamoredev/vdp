import { z } from "zod";
import {
  daysWindowSchema,
  idParamsSchema,
  localDateStringSchema,
  optionalLocalDateStringSchema,
} from "./common";

// ─── Habits (the only live health surface) ───────────────
export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  emoji: z.string().trim().max(8).nullable().optional(),
  cadence: z.enum(["daily", "weekly"]).default("daily"),
  weeklyTarget: z.number().int().min(1).max(7).optional(),
}).superRefine((value, ctx) => {
  if (value.cadence === "weekly" && value.weeklyTarget === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["weeklyTarget"],
      message: "weeklyTarget is required for weekly habits",
    });
  }
});

export const habitIdParamsSchema = idParamsSchema;

export const habitLogSchema = z.object({
  date: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
});

// ─── Counters ("days since") ─────────────────────────────
export const createCounterSchema = z.object({
  name: z.string().trim().min(1).max(100),
  emoji: z.string().trim().max(8).nullable().optional(),
  dailyCost: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Expected a decimal amount")
    .nullable()
    .optional(),
  startedAt: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
});

export const counterRelapseSchema = z.object({
  date: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
});

// ─── Goals with deadlines ────────────────────────────────
export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().nullable().optional(),
  targetDate: localDateStringSchema, // YYYY-MM-DD, must be in the future
  targetWeightKg: z
    .string()
    .regex(/^\d{1,3}(\.\d{1,2})?$/, "Expected a decimal kg value")
    .nullable()
    .optional(),
});

export const graduateGoalSchema = z.object({
  habitName: z.string().trim().min(1).max(100),
  emoji: z.string().trim().max(8).nullable().optional(),
  cadence: z.enum(["daily", "weekly"]).default("daily"),
  weeklyTarget: z.number().int().min(1).max(7).optional(),
}).superRefine((value, ctx) => {
  if (value.cadence === "weekly" && value.weeklyTarget === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["weeklyTarget"],
      message: "weeklyTarget is required for weekly habits",
    });
  }
});

// ─── Daily mood/energy check-ins ────────────────────────
export const moodCheckInSchema = z.object({
  date: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
  mood: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
});

export const moodCheckInsQuerySchema = daysWindowSchema;

// ─── Weight trend ───────────────────────────────────────
export const weightEntrySchema = z.object({
  date: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
  weightKg: z
    .string()
    .regex(/^\d{1,3}(\.\d{1,2})?$/, "Expected a decimal kg value"),
});

export const weightTrendQuerySchema = daysWindowSchema;
