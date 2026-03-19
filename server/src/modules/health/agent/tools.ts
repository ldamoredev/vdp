
// export function createHealthTools(): AgentTool[] {
//   return [
//     // ─── Health Metrics ─────────────────────────────────────
//     {
//       name: "log_health_metric",
//       description:
//         "Log a health metric (sleep_hours, steps, weight, heart_rate, water_ml, calories, mood, energy). Mood and energy are on a 1-5 scale.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           metricType: {
//             type: "string",
//             enum: ["sleep_hours", "steps", "weight", "heart_rate", "water_ml", "calories", "mood", "energy"],
//             description: "Type of metric",
//           },
//           value: { type: "number", description: "Metric value" },
//           unit: {
//             type: "string",
//             description: "Unit of measurement (hours, steps, kg, bpm, ml, kcal, scale)",
//           },
//           recordedAt: {
//             type: "string",
//             description: "ISO timestamp. Defaults to now.",
//           },
//           notes: { type: "string", description: "Optional notes" },
//         },
//         required: ["metricType", "value"],
//       },
//       execute: async (input) => {
//         const metric = await healthService.createMetric({
//           metricType: input.metricType,
//           value: input.value,
//           unit: input.unit,
//           recordedAt: input.recordedAt,
//           notes: input.notes,
//         });
//         return JSON.stringify(metric);
//       },
//     },
//     {
//       name: "get_health_metrics",
//       description:
//         "Get health metrics, optionally filtered by type and date range. Returns the most recent entries.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           metricType: {
//             type: "string",
//             enum: ["sleep_hours", "steps", "weight", "heart_rate", "water_ml", "calories", "mood", "energy"],
//           },
//           from: { type: "string", description: "Start date (YYYY-MM-DD)" },
//           to: { type: "string", description: "End date (YYYY-MM-DD)" },
//           limit: { type: "number", description: "Max results (default 30)" },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await healthService.listMetrics({
//           metricType: input.metricType,
//           from: input.from,
//           to: input.to,
//           limit: input.limit || 30,
//         });
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "get_today_summary",
//       description: "Get a summary of today's health metrics (sleep, steps, water, mood, energy).",
//       inputSchema: {
//         type: "object" as const,
//         properties: {},
//         required: [],
//       },
//       execute: async () => {
//         const result = await healthService.getTodaySummaryFull();
//         return JSON.stringify(result);
//       },
//     },
//
//     // ─── Habits ─────────────────────────────────────────────
//     {
//       name: "list_habits",
//       description: "List all active habits with their current streak.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           includeInactive: { type: "boolean", description: "Include inactive habits" },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await healthService.listHabitsWithStreaks(input.includeInactive);
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "create_habit",
//       description: "Create a new habit to track.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           name: { type: "string", description: "Habit name" },
//           description: { type: "string", description: "Description" },
//           frequency: {
//             type: "string",
//             enum: ["daily", "weekly"],
//             description: "How often (default: daily)",
//           },
//           targetValue: { type: "number", description: "Target value per completion" },
//           unit: { type: "string", description: "Unit of measurement" },
//           icon: { type: "string", description: "Emoji icon" },
//           color: { type: "string", description: "Hex color code" },
//         },
//         required: ["name"],
//       },
//       execute: async (input) => {
//         const habit = await healthService.createHabit({
//           name: input.name,
//           description: input.description,
//           frequency: input.frequency,
//           targetValue: input.targetValue,
//           unit: input.unit,
//           icon: input.icon,
//           color: input.color,
//         });
//         return JSON.stringify(habit);
//       },
//     },
//     {
//       name: "complete_habit",
//       description: "Mark a habit as completed for a given date.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           habitId: { type: "string", description: "Habit ID" },
//           date: { type: "string", description: "Date (YYYY-MM-DD). Defaults to today." },
//           value: { type: "number", description: "Optional value" },
//           notes: { type: "string", description: "Optional notes" },
//         },
//         required: ["habitId"],
//       },
//       execute: async (input) => {
//         const completion = await healthService.completeHabit(input.habitId, {
//           date: input.date,
//           value: input.value,
//           notes: input.notes,
//         });
//         return JSON.stringify(completion);
//       },
//     },
//
//     // ─── Medications ────────────────────────────────────────
//     {
//       name: "list_medications",
//       description: "List active medications.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           includeInactive: { type: "boolean" },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await healthService.listMedications(input.includeInactive);
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "create_medication",
//       description: "Add a new medication to track.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           name: { type: "string", description: "Medication name" },
//           dosage: { type: "string", description: "Dosage (e.g., '500mg')" },
//           frequency: {
//             type: "string",
//             enum: ["daily", "twice_daily", "weekly", "as_needed"],
//           },
//           timeOfDay: {
//             type: "string",
//             enum: ["morning", "afternoon", "evening", "night"],
//           },
//           startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
//           endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
//           notes: { type: "string" },
//         },
//         required: ["name", "frequency"],
//       },
//       execute: async (input) => {
//         const med = await healthService.createMedication({
//           name: input.name,
//           dosage: input.dosage,
//           frequency: input.frequency,
//           timeOfDay: input.timeOfDay,
//           startDate: input.startDate,
//           endDate: input.endDate,
//           notes: input.notes,
//         });
//         return JSON.stringify(med);
//       },
//     },
//     {
//       name: "log_medication",
//       description: "Log that a medication was taken or skipped.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           medicationId: { type: "string", description: "Medication ID" },
//           skipped: { type: "boolean", description: "Was it skipped? Default: false (taken)" },
//           takenAt: { type: "string", description: "ISO timestamp. Defaults to now." },
//           notes: { type: "string" },
//         },
//         required: ["medicationId"],
//       },
//       execute: async (input) => {
//         const log = await healthService.logMedication(input.medicationId, {
//           skipped: input.skipped,
//           takenAt: input.takenAt,
//           notes: input.notes,
//         });
//         return JSON.stringify(log);
//       },
//     },
//
//     // ─── Appointments ───────────────────────────────────────
//     {
//       name: "list_appointments",
//       description: "List appointments. Defaults to upcoming appointments.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           status: {
//             type: "string",
//             enum: ["upcoming", "completed", "cancelled"],
//           },
//           limit: { type: "number" },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await healthService.listAppointments(input.status || "upcoming");
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "create_appointment",
//       description: "Create a medical appointment.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           title: { type: "string", description: "Appointment title" },
//           doctorName: { type: "string", description: "Doctor's name" },
//           specialty: { type: "string", description: "Medical specialty" },
//           location: { type: "string", description: "Location/address" },
//           scheduledAt: { type: "string", description: "ISO timestamp for the appointment" },
//           durationMinutes: { type: "number", description: "Duration in minutes" },
//           notes: { type: "string" },
//         },
//         required: ["title", "scheduledAt"],
//       },
//       execute: async (input) => {
//         const apt = await healthService.createAppointment({
//           title: input.title,
//           doctorName: input.doctorName,
//           specialty: input.specialty,
//           location: input.location,
//           scheduledAt: input.scheduledAt,
//           durationMinutes: input.durationMinutes,
//           notes: input.notes,
//         });
//         return JSON.stringify(apt);
//       },
//     },
//     {
//       name: "update_appointment_status",
//       description: "Mark an appointment as completed or cancelled.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           appointmentId: { type: "string" },
//           status: { type: "string", enum: ["completed", "cancelled"] },
//           notes: { type: "string" },
//         },
//         required: ["appointmentId", "status"],
//       },
//       execute: async (input) => {
//         const updated = await healthService.updateAppointment(input.appointmentId, {
//           status: input.status,
//           notes: input.notes,
//         });
//         return JSON.stringify(updated || { error: "Appointment not found" });
//       },
//     },
//
//     // ─── Body Measurements ──────────────────────────────────
//     {
//       name: "log_body_measurement",
//       description:
//         "Log a body measurement (weight, height, body_fat, blood_pressure_sys, blood_pressure_dia, glucose).",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           measurementType: {
//             type: "string",
//             enum: ["weight", "height", "body_fat", "blood_pressure_sys", "blood_pressure_dia", "glucose"],
//           },
//           value: { type: "number" },
//           unit: { type: "string", description: "Unit (kg, cm, %, mmHg, mg/dL)" },
//           date: { type: "string", description: "Date (YYYY-MM-DD). Defaults to today." },
//           notes: { type: "string" },
//         },
//         required: ["measurementType", "value"],
//       },
//       execute: async (input) => {
//         const measurement = await healthService.createBodyMeasurement({
//           measurementType: input.measurementType,
//           value: input.value,
//           unit: input.unit,
//           date: input.date,
//           notes: input.notes,
//         });
//         return JSON.stringify(measurement);
//       },
//     },
//     {
//       name: "get_body_measurements",
//       description: "Get body measurements, optionally filtered by type.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           measurementType: {
//             type: "string",
//             enum: ["weight", "height", "body_fat", "blood_pressure_sys", "blood_pressure_dia", "glucose"],
//           },
//           limit: { type: "number", description: "Max results (default 30)" },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await healthService.listBodyMeasurements({
//           type: input.measurementType,
//           limit: input.limit || 30,
//         });
//         return JSON.stringify(result);
//       },
//     },
//
//     // ─── Analytics ──────────────────────────────────────────
//     {
//       name: "get_weekly_health_summary",
//       description: "Get a summary of health metrics for the past 7 days.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {},
//         required: [],
//       },
//       execute: async () => {
//         const result = await healthService.getWeeklySummary();
//         return JSON.stringify(result);
//       },
//     },
//   ];
// }
