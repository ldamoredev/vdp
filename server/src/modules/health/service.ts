
// ─── Shared unit maps ────────────────────────────────────
const metricUnitMap: Record<string, string> = {
  sleep_hours: "hours", steps: "steps", weight: "kg",
  heart_rate: "bpm", water_ml: "ml", calories: "kcal",
  mood: "scale", energy: "scale",
};

const bodyUnitMap: Record<string, string> = {
  weight: "kg", height: "cm", body_fat: "%",
  blood_pressure_sys: "mmHg", blood_pressure_dia: "mmHg", glucose: "mg/dL",
};

// class HealthService {
//   // ─── Health Metrics ──────────────────────────────────────
//
//   async listMetrics(filters: {
//     metricType?: string;
//     from?: string;
//     to?: string;
//     limit?: number;
//   }) {
//     const conditions: SQL[] = [];
//     if (filters.metricType)
//       conditions.push(eq(healthMetrics.metricType, filters.metricType));
//     if (filters.from)
//       conditions.push(gte(healthMetrics.recordedAt, new Date(filters.from)));
//     if (filters.to)
//       conditions.push(lte(healthMetrics.recordedAt, new Date(filters.to + "T23:59:59")));
//
//     return db
//       .select()
//       .from(healthMetrics)
//       .where(conditions.length > 0 ? and(...conditions) : undefined)
//       .orderBy(desc(healthMetrics.recordedAt))
//       .limit(filters.limit ?? 50);
//   }
//
//   async createMetric(data: {
//     metricType: string;
//     value: number;
//     unit?: string;
//     recordedAt?: string;
//     source?: string;
//     notes?: string | null;
//   }) {
//     const unit = data.unit || metricUnitMap[data.metricType] || "unit";
//     const recordedAt = data.recordedAt ? new Date(data.recordedAt) : new Date();
//
//     const [metric] = await db
//       .insert(healthMetrics)
//       .values({
//         metricType: data.metricType,
//         value: String(data.value),
//         unit,
//         recordedAt,
//         source: data.source || "manual",
//         notes: data.notes || null,
//       })
//       .returning();
//
//     // Emit events for significant metrics
//     if (data.metricType === "sleep_hours") {
//       const dateStr = recordedAt.toISOString().slice(0, 10);
//       if (data.value < 6) {
//         await healthEvents.poorSleep({ hours: data.value, date: dateStr });
//       } else if (data.value >= 7) {
//         await healthEvents.goodSleep({ hours: data.value, date: dateStr });
//       }
//     }
//
//     return metric;
//   }
//
//   async deleteMetric(id: string) {
//     const [deleted] = await db
//       .delete(healthMetrics)
//       .where(eq(healthMetrics.id, id))
//       .returning();
//     return deleted ?? null;
//   }
//
//   async getTodaySummary() {
//     const today = new Date().toISOString().slice(0, 10);
//     const startOfDay = new Date(today + "T00:00:00");
//     const endOfDay = new Date(today + "T23:59:59");
//
//     const metrics = await db
//       .select()
//       .from(healthMetrics)
//       .where(
//         and(
//           gte(healthMetrics.recordedAt, startOfDay),
//           lte(healthMetrics.recordedAt, endOfDay)
//         )
//       )
//       .orderBy(desc(healthMetrics.recordedAt));
//
//     // Group by type, take latest of each
//     const grouped: Record<string, (typeof metrics)[0]> = {};
//     for (const m of metrics) {
//       if (!grouped[m.metricType]) grouped[m.metricType] = m;
//     }
//
//     return { date: today, metrics: grouped, all: metrics };
//   }
//
//   async getTodaySummaryFull() {
//     const today = new Date().toISOString().slice(0, 10);
//     const startOfDay = new Date(today + "T00:00:00");
//     const endOfDay = new Date(today + "T23:59:59");
//
//     const [metrics, todayHabits, activeMeds, todayMedLogs] = await Promise.all([
//       db
//         .select()
//         .from(healthMetrics)
//         .where(
//           and(
//             gte(healthMetrics.recordedAt, startOfDay),
//             lte(healthMetrics.recordedAt, endOfDay)
//           )
//         )
//         .orderBy(desc(healthMetrics.recordedAt)),
//       db
//         .select({
//           habitId: habitCompletions.habitId,
//           habitName: habits.name,
//           value: habitCompletions.value,
//         })
//         .from(habitCompletions)
//         .innerJoin(habits, eq(habits.id, habitCompletions.habitId))
//         .where(eq(habitCompletions.completedAt, today)),
//       db.select().from(medications).where(eq(medications.isActive, true)),
//       db
//         .select()
//         .from(medicationLogs)
//         .where(
//           and(
//             gte(medicationLogs.takenAt, startOfDay),
//             lte(medicationLogs.takenAt, endOfDay)
//           )
//         ),
//     ]);
//
//     return {
//       date: today,
//       metrics,
//       habitsCompleted: todayHabits,
//       medications: activeMeds,
//       medicationsTaken: todayMedLogs,
//     };
//   }
//
//   async getWeeklyStats() {
//     const weekAgo = new Date();
//     weekAgo.setDate(weekAgo.getDate() - 7);
//
//     return db
//       .select({
//         metricType: healthMetrics.metricType,
//         avg: sql<string>`ROUND(AVG(${healthMetrics.value}::numeric), 2)::text`,
//         min: sql<string>`MIN(${healthMetrics.value}::numeric)::text`,
//         max: sql<string>`MAX(${healthMetrics.value}::numeric)::text`,
//         count: sql<number>`COUNT(*)::int`,
//       })
//       .from(healthMetrics)
//       .where(gte(healthMetrics.recordedAt, weekAgo))
//       .groupBy(healthMetrics.metricType);
//   }
//
//   async getWeeklySummary() {
//     const weekAgo = new Date();
//     weekAgo.setDate(weekAgo.getDate() - 7);
//
//     const [metrics, activeHabits, weekCompletions] = await Promise.all([
//       db
//         .select({
//           metricType: healthMetrics.metricType,
//           avgValue: sql<string>`AVG(${healthMetrics.value}::numeric)::text`,
//           minValue: sql<string>`MIN(${healthMetrics.value}::numeric)::text`,
//           maxValue: sql<string>`MAX(${healthMetrics.value}::numeric)::text`,
//           count: sql<number>`COUNT(*)::int`,
//         })
//         .from(healthMetrics)
//         .where(gte(healthMetrics.recordedAt, weekAgo))
//         .groupBy(healthMetrics.metricType),
//       db.select().from(habits).where(eq(habits.isActive, true)),
//       db
//         .select({
//           habitId: habitCompletions.habitId,
//           count: sql<number>`COUNT(*)::int`,
//         })
//         .from(habitCompletions)
//         .where(gte(habitCompletions.completedAt, weekAgo.toISOString().slice(0, 10)))
//         .groupBy(habitCompletions.habitId),
//     ]);
//
//     return {
//       period: "last_7_days",
//       metrics,
//       habitCompletionRate: {
//         totalHabits: activeHabits.length,
//         completions: weekCompletions,
//       },
//     };
//   }
//
//   // ─── Habits ──────────────────────────────────────────────
//
//   async listHabits(includeInactive?: boolean) {
//     const condition = includeInactive ? undefined : eq(habits.isActive, true);
//     return db.select().from(habits).where(condition);
//   }
//
//   async listHabitsWithStreaks(includeInactive?: boolean) {
//     const condition = includeInactive ? undefined : eq(habits.isActive, true);
//     const result = await db.select().from(habits).where(condition);
//
//     const habitsWithStreaks = await Promise.all(
//       result.map(async (habit) => {
//         const completions = await db
//           .select({ completedAt: habitCompletions.completedAt })
//           .from(habitCompletions)
//           .where(eq(habitCompletions.habitId, habit.id))
//           .orderBy(desc(habitCompletions.completedAt))
//           .limit(90);
//
//         let streak = 0;
//         const checkDate = new Date();
//
//         for (let i = 0; i < 90; i++) {
//           const dateStr = checkDate.toISOString().slice(0, 10);
//           const found = completions.some((c) => c.completedAt === dateStr);
//           if (found) {
//             streak++;
//             checkDate.setDate(checkDate.getDate() - 1);
//           } else if (i === 0) {
//             checkDate.setDate(checkDate.getDate() - 1);
//             continue;
//           } else {
//             break;
//           }
//         }
//
//         return { ...habit, currentStreak: streak };
//       })
//     );
//
//     return habitsWithStreaks;
//   }
//
//   async createHabit(data: {
//     name: string;
//     description?: string | null;
//     frequency?: string;
//     targetValue?: number | null;
//     unit?: string | null;
//     icon?: string | null;
//     color?: string | null;
//   }) {
//     const [habit] = await db
//       .insert(habits)
//       .values({
//         name: data.name,
//         description: data.description || null,
//         frequency: data.frequency || "daily",
//         targetValue: data.targetValue ? String(data.targetValue) : null,
//         unit: data.unit || null,
//         icon: data.icon || null,
//         color: data.color || null,
//       })
//       .returning();
//     return habit;
//   }
//
//   async updateHabit(id: string, data: Record<string, unknown>) {
//     const updateData: Record<string, unknown> = { updatedAt: new Date() };
//     for (const [k, v] of Object.entries(data)) {
//       if (v !== undefined) {
//         updateData[k] = k === "targetValue" && typeof v === "number" ? String(v) : v;
//       }
//     }
//
//     const [updated] = await db
//       .update(habits)
//       .set(updateData)
//       .where(eq(habits.id, id))
//       .returning();
//     return updated ?? null;
//   }
//
//   async deactivateHabit(id: string) {
//     const [updated] = await db
//       .update(habits)
//       .set({ isActive: false, updatedAt: new Date() })
//       .where(eq(habits.id, id))
//       .returning();
//     return updated ?? null;
//   }
//
//   async listCompletions(habitId: string, from?: string) {
//     const conditions: SQL[] = [eq(habitCompletions.habitId, habitId)];
//     if (from) conditions.push(gte(habitCompletions.completedAt, from));
//
//     return db
//       .select()
//       .from(habitCompletions)
//       .where(and(...conditions))
//       .orderBy(desc(habitCompletions.completedAt));
//   }
//
//   async completeHabit(habitId: string, data: {
//     date?: string;
//     value?: number | null;
//     notes?: string | null;
//   }) {
//     const [completion] = await db
//       .insert(habitCompletions)
//       .values({
//         habitId,
//         completedAt: data.date || new Date().toISOString().slice(0, 10),
//         value: data.value ? String(data.value) : null,
//         notes: data.notes || null,
//       })
//       .returning();
//     return completion;
//   }
//
//   // ─── Medications ─────────────────────────────────────────
//
//   async listMedications(includeInactive?: boolean) {
//     const condition = includeInactive ? undefined : eq(medications.isActive, true);
//     return db.select().from(medications).where(condition);
//   }
//
//   async createMedication(data: {
//     name: string;
//     dosage?: string | null;
//     frequency: string;
//     timeOfDay?: string | null;
//     startDate?: string;
//     endDate?: string | null;
//     notes?: string | null;
//   }) {
//     const [med] = await db
//       .insert(medications)
//       .values({
//         name: data.name,
//         dosage: data.dosage || null,
//         frequency: data.frequency,
//         timeOfDay: data.timeOfDay || null,
//         startDate: data.startDate || new Date().toISOString().slice(0, 10),
//         endDate: data.endDate || null,
//         notes: data.notes || null,
//       })
//       .returning();
//     return med;
//   }
//
//   async updateMedication(id: string, data: Record<string, unknown>) {
//     const updateData: Record<string, unknown> = { updatedAt: new Date() };
//     for (const [k, v] of Object.entries(data)) {
//       if (v !== undefined) updateData[k] = v;
//     }
//
//     const [updated] = await db
//       .update(medications)
//       .set(updateData)
//       .where(eq(medications.id, id))
//       .returning();
//     return updated ?? null;
//   }
//
//   async deactivateMedication(id: string) {
//     const [updated] = await db
//       .update(medications)
//       .set({ isActive: false, updatedAt: new Date() })
//       .where(eq(medications.id, id))
//       .returning();
//     return updated ?? null;
//   }
//
//   async listMedicationLogs(medicationId: string, filters: { from?: string; to?: string }) {
//     const conditions: SQL[] = [eq(medicationLogs.medicationId, medicationId)];
//     if (filters.from) conditions.push(gte(medicationLogs.takenAt, new Date(filters.from)));
//     if (filters.to)
//       conditions.push(lte(medicationLogs.takenAt, new Date(filters.to + "T23:59:59")));
//
//     return db
//       .select()
//       .from(medicationLogs)
//       .where(and(...conditions))
//       .orderBy(desc(medicationLogs.takenAt));
//   }
//
//   async logMedication(medicationId: string, data: {
//     skipped?: boolean;
//     takenAt?: string;
//     notes?: string | null;
//   }) {
//     const takenAt = data.takenAt ? new Date(data.takenAt) : new Date();
//
//     const [log] = await db
//       .insert(medicationLogs)
//       .values({
//         medicationId,
//         takenAt,
//         skipped: data.skipped || false,
//         notes: data.notes || null,
//       })
//       .returning();
//
//     // Emit event when medication is skipped (consistent across routes + tools)
//     if (data.skipped) {
//       const [med] = await db
//         .select()
//         .from(medications)
//         .where(eq(medications.id, medicationId));
//       if (med) {
//         await healthEvents.medicationMissed({
//           medicationId: med.id,
//           medicationName: med.name,
//           scheduledTime: takenAt.toISOString(),
//         });
//       }
//     }
//
//     return log;
//   }
//
//   // ─── Appointments ────────────────────────────────────────
//
//   async listAppointments(status?: string) {
//     const conditions: SQL[] = [];
//     if (status) conditions.push(eq(appointments.status, status));
//
//     return db
//       .select()
//       .from(appointments)
//       .where(conditions.length > 0 ? and(...conditions) : undefined)
//       .orderBy(asc(appointments.scheduledAt));
//   }
//
//   async getAppointment(id: string) {
//     const result = await db.select().from(appointments).where(eq(appointments.id, id));
//     return result[0] ?? null;
//   }
//
//   async createAppointment(data: {
//     title: string;
//     doctorName?: string | null;
//     specialty?: string | null;
//     location?: string | null;
//     scheduledAt: string;
//     durationMinutes?: number | null;
//     notes?: string | null;
//   }) {
//     const [apt] = await db
//       .insert(appointments)
//       .values({
//         title: data.title,
//         doctorName: data.doctorName || null,
//         specialty: data.specialty || null,
//         location: data.location || null,
//         scheduledAt: new Date(data.scheduledAt),
//         durationMinutes: data.durationMinutes || null,
//         notes: data.notes || null,
//       })
//       .returning();
//     return apt;
//   }
//
//   async updateAppointment(id: string, data: Record<string, unknown>) {
//     const updateData: Record<string, unknown> = { updatedAt: new Date() };
//     for (const [k, v] of Object.entries(data)) {
//       if (v !== undefined) {
//         updateData[k] = k === "scheduledAt" ? new Date(v as string) : v;
//       }
//     }
//
//     const [updated] = await db
//       .update(appointments)
//       .set(updateData)
//       .where(eq(appointments.id, id))
//       .returning();
//     return updated ?? null;
//   }
//
//   async deleteAppointment(id: string) {
//     const [deleted] = await db
//       .delete(appointments)
//       .where(eq(appointments.id, id))
//       .returning();
//     return deleted ?? null;
//   }
//
//   // ─── Body Measurements ──────────────────────────────────
//
//   async listBodyMeasurements(filters: {
//     type?: string;
//     from?: string;
//     to?: string;
//     limit?: number;
//   }) {
//     const conditions: SQL[] = [];
//     if (filters.type)
//       conditions.push(eq(bodyMeasurements.measurementType, filters.type));
//     if (filters.from)
//       conditions.push(gte(bodyMeasurements.recordedAt, filters.from));
//     if (filters.to)
//       conditions.push(lte(bodyMeasurements.recordedAt, filters.to));
//
//     return db
//       .select()
//       .from(bodyMeasurements)
//       .where(conditions.length > 0 ? and(...conditions) : undefined)
//       .orderBy(desc(bodyMeasurements.recordedAt))
//       .limit(filters.limit ?? 50);
//   }
//
//   async createBodyMeasurement(data: {
//     measurementType: string;
//     value: number;
//     unit?: string;
//     date?: string;
//     notes?: string | null;
//   }) {
//     const unit = data.unit || bodyUnitMap[data.measurementType] || "unit";
//
//     const [measurement] = await db
//       .insert(bodyMeasurements)
//       .values({
//         measurementType: data.measurementType,
//         value: String(data.value),
//         unit,
//         recordedAt: data.date || new Date().toISOString().slice(0, 10),
//         notes: data.notes || null,
//       })
//       .returning();
//     return measurement;
//   }
//
//   async deleteBodyMeasurement(id: string) {
//     const [deleted] = await db
//       .delete(bodyMeasurements)
//       .where(eq(bodyMeasurements.id, id))
//       .returning();
//     return deleted ?? null;
//   }
// }

// export const healthService = new HealthService();
