import type { AgentTool } from "../../../agents/base-agent.js";
import { db } from "../../../core/db/client.js";
import {
  healthMetrics,
  habits,
  habitCompletions,
  medications,
  medicationLogs,
  appointments,
  bodyMeasurements,
} from "../schema.js";
import { healthEvents } from "../events.js";
import { eq, and, gte, lte, desc, sql, asc } from "drizzle-orm";

export function createHealthTools(): AgentTool[] {
  return [
    // ─── Health Metrics ─────────────────────────────────────
    {
      name: "log_health_metric",
      description:
        "Log a health metric (sleep_hours, steps, weight, heart_rate, water_ml, calories, mood, energy). Mood and energy are on a 1-5 scale.",
      inputSchema: {
        type: "object" as const,
        properties: {
          metricType: {
            type: "string",
            enum: ["sleep_hours", "steps", "weight", "heart_rate", "water_ml", "calories", "mood", "energy"],
            description: "Type of metric",
          },
          value: { type: "number", description: "Metric value" },
          unit: {
            type: "string",
            description: "Unit of measurement (hours, steps, kg, bpm, ml, kcal, scale)",
          },
          recordedAt: {
            type: "string",
            description: "ISO timestamp. Defaults to now.",
          },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["metricType", "value"],
      },
      execute: async (input) => {
        const unitMap: Record<string, string> = {
          sleep_hours: "hours", steps: "steps", weight: "kg",
          heart_rate: "bpm", water_ml: "ml", calories: "kcal",
          mood: "scale", energy: "scale",
        };
        const unit = input.unit || unitMap[input.metricType] || "unit";
        const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();

        const [metric] = await db
          .insert(healthMetrics)
          .values({
            metricType: input.metricType,
            value: String(input.value),
            unit,
            recordedAt,
            source: "manual",
            notes: input.notes || null,
          })
          .returning();

        // Emit events for significant metrics
        if (input.metricType === "sleep_hours") {
          if (input.value < 6) {
            await healthEvents.poorSleep({
              hours: input.value,
              date: recordedAt.toISOString().slice(0, 10),
            });
          } else if (input.value >= 7) {
            await healthEvents.goodSleep({
              hours: input.value,
              date: recordedAt.toISOString().slice(0, 10),
            });
          }
        }

        return JSON.stringify(metric);
      },
    },
    {
      name: "get_health_metrics",
      description:
        "Get health metrics, optionally filtered by type and date range. Returns the most recent entries.",
      inputSchema: {
        type: "object" as const,
        properties: {
          metricType: {
            type: "string",
            enum: ["sleep_hours", "steps", "weight", "heart_rate", "water_ml", "calories", "mood", "energy"],
          },
          from: { type: "string", description: "Start date (YYYY-MM-DD)" },
          to: { type: "string", description: "End date (YYYY-MM-DD)" },
          limit: { type: "number", description: "Max results (default 30)" },
        },
        required: [],
      },
      execute: async (input) => {
        const conditions = [];
        if (input.metricType)
          conditions.push(eq(healthMetrics.metricType, input.metricType));
        if (input.from)
          conditions.push(gte(healthMetrics.recordedAt, new Date(input.from)));
        if (input.to)
          conditions.push(lte(healthMetrics.recordedAt, new Date(input.to + "T23:59:59")));

        const result = await db
          .select()
          .from(healthMetrics)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(healthMetrics.recordedAt))
          .limit(input.limit || 30);

        return JSON.stringify(result);
      },
    },
    {
      name: "get_today_summary",
      description: "Get a summary of today's health metrics (sleep, steps, water, mood, energy).",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
      execute: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const startOfDay = new Date(today + "T00:00:00");
        const endOfDay = new Date(today + "T23:59:59");

        const metrics = await db
          .select()
          .from(healthMetrics)
          .where(
            and(
              gte(healthMetrics.recordedAt, startOfDay),
              lte(healthMetrics.recordedAt, endOfDay)
            )
          )
          .orderBy(desc(healthMetrics.recordedAt));

        // Get today's habit completions
        const todayHabits = await db
          .select({
            habitId: habitCompletions.habitId,
            habitName: habits.name,
            value: habitCompletions.value,
          })
          .from(habitCompletions)
          .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
          .where(eq(habitCompletions.completedAt, today));

        // Get active medications due today
        const activeMeds = await db
          .select()
          .from(medications)
          .where(eq(medications.isActive, true));

        // Get today's med logs
        const todayMedLogs = await db
          .select()
          .from(medicationLogs)
          .where(
            and(
              gte(medicationLogs.takenAt, startOfDay),
              lte(medicationLogs.takenAt, endOfDay)
            )
          );

        return JSON.stringify({
          date: today,
          metrics,
          habitsCompleted: todayHabits,
          medications: activeMeds,
          medicationsTaken: todayMedLogs,
        });
      },
    },

    // ─── Habits ─────────────────────────────────────────────
    {
      name: "list_habits",
      description: "List all active habits with their current streak.",
      inputSchema: {
        type: "object" as const,
        properties: {
          includeInactive: { type: "boolean", description: "Include inactive habits" },
        },
        required: [],
      },
      execute: async (input) => {
        const condition = input.includeInactive ? undefined : eq(habits.isActive, true);
        const result = await db.select().from(habits).where(condition);

        // Calculate streaks for each habit
        const habitsWithStreaks = await Promise.all(
          result.map(async (habit) => {
            const completions = await db
              .select({ completedAt: habitCompletions.completedAt })
              .from(habitCompletions)
              .where(eq(habitCompletions.habitId, habit.id))
              .orderBy(desc(habitCompletions.completedAt))
              .limit(90);

            let streak = 0;
            const today = new Date();
            const checkDate = new Date(today);

            for (let i = 0; i < 90; i++) {
              const dateStr = checkDate.toISOString().slice(0, 10);
              const found = completions.some((c) => c.completedAt === dateStr);
              if (found) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else if (i === 0) {
                // Today might not be completed yet, check yesterday
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
              } else {
                break;
              }
            }

            return { ...habit, currentStreak: streak };
          })
        );

        return JSON.stringify(habitsWithStreaks);
      },
    },
    {
      name: "create_habit",
      description: "Create a new habit to track.",
      inputSchema: {
        type: "object" as const,
        properties: {
          name: { type: "string", description: "Habit name" },
          description: { type: "string", description: "Description" },
          frequency: {
            type: "string",
            enum: ["daily", "weekly"],
            description: "How often (default: daily)",
          },
          targetValue: { type: "number", description: "Target value per completion" },
          unit: { type: "string", description: "Unit of measurement" },
          icon: { type: "string", description: "Emoji icon" },
          color: { type: "string", description: "Hex color code" },
        },
        required: ["name"],
      },
      execute: async (input) => {
        const [habit] = await db
          .insert(habits)
          .values({
            name: input.name,
            description: input.description || null,
            frequency: input.frequency || "daily",
            targetValue: input.targetValue ? String(input.targetValue) : null,
            unit: input.unit || null,
            icon: input.icon || null,
            color: input.color || null,
          })
          .returning();
        return JSON.stringify(habit);
      },
    },
    {
      name: "complete_habit",
      description: "Mark a habit as completed for a given date.",
      inputSchema: {
        type: "object" as const,
        properties: {
          habitId: { type: "string", description: "Habit ID" },
          date: { type: "string", description: "Date (YYYY-MM-DD). Defaults to today." },
          value: { type: "number", description: "Optional value" },
          notes: { type: "string", description: "Optional notes" },
        },
        required: ["habitId"],
      },
      execute: async (input) => {
        const completedAt = input.date || new Date().toISOString().slice(0, 10);

        const [completion] = await db
          .insert(habitCompletions)
          .values({
            habitId: input.habitId,
            completedAt,
            value: input.value ? String(input.value) : null,
            notes: input.notes || null,
          })
          .returning();

        return JSON.stringify(completion);
      },
    },

    // ─── Medications ────────────────────────────────────────
    {
      name: "list_medications",
      description: "List active medications.",
      inputSchema: {
        type: "object" as const,
        properties: {
          includeInactive: { type: "boolean" },
        },
        required: [],
      },
      execute: async (input) => {
        const condition = input.includeInactive ? undefined : eq(medications.isActive, true);
        const result = await db.select().from(medications).where(condition);
        return JSON.stringify(result);
      },
    },
    {
      name: "create_medication",
      description: "Add a new medication to track.",
      inputSchema: {
        type: "object" as const,
        properties: {
          name: { type: "string", description: "Medication name" },
          dosage: { type: "string", description: "Dosage (e.g., '500mg')" },
          frequency: {
            type: "string",
            enum: ["daily", "twice_daily", "weekly", "as_needed"],
          },
          timeOfDay: {
            type: "string",
            enum: ["morning", "afternoon", "evening", "night"],
          },
          startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
          endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
          notes: { type: "string" },
        },
        required: ["name", "frequency"],
      },
      execute: async (input) => {
        const [med] = await db
          .insert(medications)
          .values({
            name: input.name,
            dosage: input.dosage || null,
            frequency: input.frequency,
            timeOfDay: input.timeOfDay || null,
            startDate: input.startDate || new Date().toISOString().slice(0, 10),
            endDate: input.endDate || null,
            notes: input.notes || null,
          })
          .returning();
        return JSON.stringify(med);
      },
    },
    {
      name: "log_medication",
      description: "Log that a medication was taken or skipped.",
      inputSchema: {
        type: "object" as const,
        properties: {
          medicationId: { type: "string", description: "Medication ID" },
          skipped: { type: "boolean", description: "Was it skipped? Default: false (taken)" },
          takenAt: { type: "string", description: "ISO timestamp. Defaults to now." },
          notes: { type: "string" },
        },
        required: ["medicationId"],
      },
      execute: async (input) => {
        const takenAt = input.takenAt ? new Date(input.takenAt) : new Date();
        const [log] = await db
          .insert(medicationLogs)
          .values({
            medicationId: input.medicationId,
            takenAt,
            skipped: input.skipped || false,
            notes: input.notes || null,
          })
          .returning();

        if (input.skipped) {
          const [med] = await db
            .select()
            .from(medications)
            .where(eq(medications.id, input.medicationId));
          if (med) {
            await healthEvents.medicationMissed({
              medicationId: med.id,
              medicationName: med.name,
              scheduledTime: takenAt.toISOString(),
            });
          }
        }

        return JSON.stringify(log);
      },
    },

    // ─── Appointments ───────────────────────────────────────
    {
      name: "list_appointments",
      description: "List appointments. Defaults to upcoming appointments.",
      inputSchema: {
        type: "object" as const,
        properties: {
          status: {
            type: "string",
            enum: ["upcoming", "completed", "cancelled"],
          },
          limit: { type: "number" },
        },
        required: [],
      },
      execute: async (input) => {
        const conditions = [];
        if (input.status) {
          conditions.push(eq(appointments.status, input.status));
        } else {
          conditions.push(eq(appointments.status, "upcoming"));
        }

        const result = await db
          .select()
          .from(appointments)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(appointments.scheduledAt))
          .limit(input.limit || 20);

        return JSON.stringify(result);
      },
    },
    {
      name: "create_appointment",
      description: "Create a medical appointment.",
      inputSchema: {
        type: "object" as const,
        properties: {
          title: { type: "string", description: "Appointment title" },
          doctorName: { type: "string", description: "Doctor's name" },
          specialty: { type: "string", description: "Medical specialty" },
          location: { type: "string", description: "Location/address" },
          scheduledAt: { type: "string", description: "ISO timestamp for the appointment" },
          durationMinutes: { type: "number", description: "Duration in minutes" },
          notes: { type: "string" },
        },
        required: ["title", "scheduledAt"],
      },
      execute: async (input) => {
        const [apt] = await db
          .insert(appointments)
          .values({
            title: input.title,
            doctorName: input.doctorName || null,
            specialty: input.specialty || null,
            location: input.location || null,
            scheduledAt: new Date(input.scheduledAt),
            durationMinutes: input.durationMinutes || null,
            notes: input.notes || null,
          })
          .returning();
        return JSON.stringify(apt);
      },
    },
    {
      name: "update_appointment_status",
      description: "Mark an appointment as completed or cancelled.",
      inputSchema: {
        type: "object" as const,
        properties: {
          appointmentId: { type: "string" },
          status: { type: "string", enum: ["completed", "cancelled"] },
          notes: { type: "string" },
        },
        required: ["appointmentId", "status"],
      },
      execute: async (input) => {
        const [updated] = await db
          .update(appointments)
          .set({
            status: input.status,
            notes: input.notes || undefined,
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, input.appointmentId))
          .returning();
        return JSON.stringify(updated || { error: "Appointment not found" });
      },
    },

    // ─── Body Measurements ──────────────────────────────────
    {
      name: "log_body_measurement",
      description:
        "Log a body measurement (weight, height, body_fat, blood_pressure_sys, blood_pressure_dia, glucose).",
      inputSchema: {
        type: "object" as const,
        properties: {
          measurementType: {
            type: "string",
            enum: ["weight", "height", "body_fat", "blood_pressure_sys", "blood_pressure_dia", "glucose"],
          },
          value: { type: "number" },
          unit: { type: "string", description: "Unit (kg, cm, %, mmHg, mg/dL)" },
          date: { type: "string", description: "Date (YYYY-MM-DD). Defaults to today." },
          notes: { type: "string" },
        },
        required: ["measurementType", "value"],
      },
      execute: async (input) => {
        const unitMap: Record<string, string> = {
          weight: "kg", height: "cm", body_fat: "%",
          blood_pressure_sys: "mmHg", blood_pressure_dia: "mmHg", glucose: "mg/dL",
        };
        const unit = input.unit || unitMap[input.measurementType] || "unit";
        const recordedAt = input.date || new Date().toISOString().slice(0, 10);

        const [measurement] = await db
          .insert(bodyMeasurements)
          .values({
            measurementType: input.measurementType,
            value: String(input.value),
            unit,
            recordedAt,
            notes: input.notes || null,
          })
          .returning();

        return JSON.stringify(measurement);
      },
    },
    {
      name: "get_body_measurements",
      description: "Get body measurements, optionally filtered by type.",
      inputSchema: {
        type: "object" as const,
        properties: {
          measurementType: {
            type: "string",
            enum: ["weight", "height", "body_fat", "blood_pressure_sys", "blood_pressure_dia", "glucose"],
          },
          limit: { type: "number", description: "Max results (default 30)" },
        },
        required: [],
      },
      execute: async (input) => {
        const conditions = [];
        if (input.measurementType)
          conditions.push(eq(bodyMeasurements.measurementType, input.measurementType));

        const result = await db
          .select()
          .from(bodyMeasurements)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(bodyMeasurements.recordedAt))
          .limit(input.limit || 30);

        return JSON.stringify(result);
      },
    },

    // ─── Analytics ──────────────────────────────────────────
    {
      name: "get_weekly_health_summary",
      description: "Get a summary of health metrics for the past 7 days.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
      execute: async () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const metrics = await db
          .select({
            metricType: healthMetrics.metricType,
            avgValue: sql<string>`AVG(${healthMetrics.value}::numeric)::text`,
            minValue: sql<string>`MIN(${healthMetrics.value}::numeric)::text`,
            maxValue: sql<string>`MAX(${healthMetrics.value}::numeric)::text`,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(healthMetrics)
          .where(gte(healthMetrics.recordedAt, weekAgo))
          .groupBy(healthMetrics.metricType);

        // Habit completion rate
        const activeHabits = await db
          .select()
          .from(habits)
          .where(eq(habits.isActive, true));

        const weekCompletions = await db
          .select({
            habitId: habitCompletions.habitId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(habitCompletions)
          .where(gte(habitCompletions.completedAt, weekAgo.toISOString().slice(0, 10)))
          .groupBy(habitCompletions.habitId);

        return JSON.stringify({
          period: "last_7_days",
          metrics,
          habitCompletionRate: {
            totalHabits: activeHabits.length,
            completions: weekCompletions,
          },
        });
      },
    },
  ];
}
