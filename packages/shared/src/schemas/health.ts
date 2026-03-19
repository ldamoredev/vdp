import { z } from "zod";
import {
  dateRangeSchema,
  dateStringSchema,
  nullableDateStringSchema,
  optionalDateStringSchema,
} from "./common";

// ─── Enums ───────────────────────────────────────────────
const metricTypeEnum = z.enum([
  "sleep_hours", "steps", "weight", "heart_rate",
  "water_ml", "calories", "mood", "energy",
]);

const habitFrequencyEnum = z.enum(["daily", "weekly"]);

const medicationFrequencyEnum = z.enum([
  "daily", "twice_daily", "weekly", "as_needed",
]);

const timeOfDayEnum = z.enum(["morning", "afternoon", "evening", "night"]);

const appointmentStatusEnum = z.enum(["upcoming", "completed", "cancelled"]);

const bodyMeasurementTypeEnum = z.enum([
  "weight", "height", "body_fat",
  "blood_pressure_sys", "blood_pressure_dia", "glucose",
]);

// ─── Health Metrics ──────────────────────────────────────
export const createMetricSchema = z.object({
  metricType: metricTypeEnum,
  value: z.coerce.number(),
  unit: z.string().max(20).optional(),
  recordedAt: optionalDateStringSchema,
  source: z.string().max(30).optional(),
  notes: z.string().nullable().optional(),
});

export const metricFiltersSchema = dateRangeSchema.extend({
  metricType: metricTypeEnum.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// ─── Habits ──────────────────────────────────────────────
export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  frequency: habitFrequencyEnum.default("daily"),
  targetValue: z.coerce.number().positive().nullable().optional(),
  unit: z.string().max(30).nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().max(7).nullable().optional(),
});

export const updateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  frequency: habitFrequencyEnum.optional(),
  targetValue: z.coerce.number().positive().nullable().optional(),
  unit: z.string().max(30).nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().max(7).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const habitFiltersSchema = z.object({
  includeInactive: z.coerce.boolean().default(false),
});

export const completeHabitSchema = z.object({
  date: optionalDateStringSchema,
  value: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const completionFiltersSchema = z.object({
  from: optionalDateStringSchema,
});

// ─── Medications ─────────────────────────────────────────
export const createMedicationSchema = z.object({
  name: z.string().min(1).max(100),
  dosage: z.string().max(50).nullable().optional(),
  frequency: medicationFrequencyEnum,
  timeOfDay: timeOfDayEnum.nullable().optional(),
  startDate: optionalDateStringSchema,
  endDate: nullableDateStringSchema,
  notes: z.string().nullable().optional(),
});

export const updateMedicationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  dosage: z.string().max(50).nullable().optional(),
  frequency: medicationFrequencyEnum.optional(),
  timeOfDay: timeOfDayEnum.nullable().optional(),
  endDate: nullableDateStringSchema,
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export const medicationFiltersSchema = z.object({
  includeInactive: z.coerce.boolean().default(false),
});

export const logMedicationSchema = z.object({
  skipped: z.boolean().default(false),
  takenAt: optionalDateStringSchema,
  notes: z.string().nullable().optional(),
});

export const medicationLogFiltersSchema = dateRangeSchema;

// ─── Appointments ────────────────────────────────────────
export const createAppointmentSchema = z.object({
  title: z.string().min(1).max(200),
  doctorName: z.string().max(100).nullable().optional(),
  specialty: z.string().max(60).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  scheduledAt: dateStringSchema,
  durationMinutes: z.coerce.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateAppointmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  doctorName: z.string().max(100).nullable().optional(),
  specialty: z.string().max(60).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  scheduledAt: optionalDateStringSchema,
  durationMinutes: z.coerce.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: appointmentStatusEnum.optional(),
});

export const appointmentFiltersSchema = z.object({
  status: appointmentStatusEnum.optional(),
});

// ─── Body Measurements ──────────────────────────────────
export const createBodyMeasurementSchema = z.object({
  measurementType: bodyMeasurementTypeEnum,
  value: z.coerce.number(),
  unit: z.string().max(20).optional(),
  date: optionalDateStringSchema,
  notes: z.string().nullable().optional(),
});

export const bodyMeasurementFiltersSchema = dateRangeSchema.extend({
  type: bodyMeasurementTypeEnum.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
