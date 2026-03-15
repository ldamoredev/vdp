import {
  pgSchema,
  uuid,
  varchar,
  decimal,
  boolean,
  timestamp,
  date,
  text,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const healthSchema = pgSchema("health");

// ─── Health Metrics ───────────────────────────────────────
// Generic time-series table for all quantifiable health data
export const healthMetrics = healthSchema.table(
  "health_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    metricType: varchar("metric_type", { length: 30 }).notNull(),
    // Types: sleep_hours, steps, weight, heart_rate, water_ml, calories, mood, energy
    value: decimal("value", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull(),
    // Units: hours, steps, kg, bpm, ml, kcal, 1-5 scale
    recordedAt: timestamp("recorded_at").notNull(),
    source: varchar("source", { length: 30 }).notNull().default("manual"),
    // Sources: manual, apple_health, fitbit, garmin
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("hm_type_recorded_idx").on(table.metricType, table.recordedAt),
  ]
);

// ─── Habits ───────────────────────────────────────────────
export const habits = healthSchema.table("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  frequency: varchar("frequency", { length: 20 }).notNull().default("daily"),
  // Frequency: daily, weekly, custom
  targetValue: decimal("target_value", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 30 }),
  icon: varchar("icon", { length: 10 }),
  color: varchar("color", { length: 7 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const habitCompletions = healthSchema.table(
  "habit_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id),
    completedAt: date("completed_at").notNull(),
    value: decimal("value", { precision: 10, scale: 2 }),
    notes: text("notes"),
  },
  (table) => [
    index("hc_habit_completed_idx").on(table.habitId, table.completedAt),
  ]
);

// ─── Medications ──────────────────────────────────────────
export const medications = healthSchema.table("medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  dosage: varchar("dosage", { length: 50 }),
  frequency: varchar("frequency", { length: 30 }).notNull(),
  // Frequency: daily, twice_daily, weekly, as_needed
  timeOfDay: varchar("time_of_day", { length: 20 }),
  // morning, afternoon, evening, night
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const medicationLogs = healthSchema.table(
  "medication_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medicationId: uuid("medication_id")
      .notNull()
      .references(() => medications.id),
    takenAt: timestamp("taken_at").notNull(),
    skipped: boolean("skipped").notNull().default(false),
    notes: text("notes"),
  },
  (table) => [
    index("ml_med_taken_idx").on(table.medicationId, table.takenAt),
  ]
);

// ─── Appointments ─────────────────────────────────────────
export const appointments = healthSchema.table(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    doctorName: varchar("doctor_name", { length: 100 }),
    specialty: varchar("specialty", { length: 60 }),
    location: varchar("location", { length: 200 }),
    scheduledAt: timestamp("scheduled_at").notNull(),
    durationMinutes: integer("duration_minutes"),
    notes: text("notes"),
    status: varchar("status", { length: 20 }).notNull().default("upcoming"),
    // Status: upcoming, completed, cancelled
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("apt_scheduled_idx").on(table.scheduledAt),
  ]
);

// ─── Body Measurements ────────────────────────────────────
export const bodyMeasurements = healthSchema.table(
  "body_measurements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    measurementType: varchar("measurement_type", { length: 30 }).notNull(),
    // Types: weight, height, body_fat, blood_pressure_sys, blood_pressure_dia, glucose
    value: decimal("value", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull(),
    recordedAt: date("recorded_at").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("bm_type_recorded_idx").on(table.measurementType, table.recordedAt),
  ]
);

// ─── Agent Conversations (Health-specific) ────────────────
export const healthAgentConversations = healthSchema.table("agent_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const healthAgentMessages = healthSchema.table(
  "agent_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => healthAgentConversations.id),
    role: varchar("role", { length: 10 }).notNull(),
    content: text("content"),
    toolCalls: text("tool_calls"),
    toolResult: text("tool_result"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("health_msg_conversation_idx").on(table.conversationId),
  ]
);
