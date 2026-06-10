import { request } from "@/lib/api/client";

// Health is a demo/inactive domain (see AGENTS.md): there is no real backend
// contract yet, so its API client and types live next to the demo pages
// instead of in features/ or @vdp/shared.
export interface HealthMetric {
  id: string;
  metricType: string;
  value: string;
  unit: string | null;
  recordedAt: string;
  source: string | null;
  notes: string | null;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  targetValue: number | null;
  unit: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  streak?: number;
  completedToday?: boolean;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
  value: number | null;
  notes: string | null;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string;
  timeOfDay: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string;
  skipped: boolean;
  notes: string | null;
}

export interface Appointment {
  id: string;
  title: string;
  doctorName: string | null;
  specialty: string | null;
  location: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
  status: "upcoming" | "completed" | "cancelled";
  notes: string | null;
}

export interface BodyMeasurement {
  id: string;
  measurementType: string;
  value: string;
  unit: string | null;
  date: string;
  notes: string | null;
}

export interface TodaySummary {
  metrics: Record<string, { value: string; unit: string }>;
  habitsCompleted: number;
  habitsTotal: number;
}

export interface WeeklyStat {
  date: string;
  metrics: Record<string, number>;
}

export const healthApi = {
  // ─── Metrics ─────────────────────────────────────────────
  getMetrics: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<HealthMetric[]>(`/health/metrics${qs}`);
  },
  logMetric: (data: {
    metricType: string;
    value: number;
    unit?: string;
    recordedAt?: string;
    notes?: string;
    source?: string;
  }) => request<HealthMetric>("/health/metrics", { method: "POST", body: JSON.stringify(data) }),
  deleteMetric: (id: string) =>
    request<void>(`/health/metrics/${id}`, { method: "DELETE" }),
  getTodaySummary: () => request<TodaySummary>("/health/today"),
  getWeeklyStats: () => request<WeeklyStat[]>("/health/stats/weekly"),

  // ─── Habits ──────────────────────────────────────────────
  getHabits: (includeInactive?: boolean) =>
    request<Habit[]>(`/health/habits${includeInactive ? "?includeInactive=true" : ""}`),
  createHabit: (data: {
    name: string;
    description?: string;
    frequency?: string;
    targetValue?: number;
    unit?: string;
    icon?: string;
    color?: string;
  }) => request<Habit>("/health/habits", { method: "POST", body: JSON.stringify(data) }),
  updateHabit: (id: string, data: Partial<Pick<Habit, "name" | "description" | "frequency" | "targetValue" | "unit" | "icon" | "color" | "isActive">>) =>
    request<Habit>(`/health/habits/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteHabit: (id: string) =>
    request<void>(`/health/habits/${id}`, { method: "DELETE" }),
  getHabitCompletions: (id: string, from?: string) => {
    const qs = from ? `?from=${from}` : "";
    return request<HabitCompletion[]>(`/health/habits/${id}/completions${qs}`);
  },
  completeHabit: (id: string, data?: { date?: string; value?: number; notes?: string }) =>
    request<HabitCompletion>(`/health/habits/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  // ─── Medications ─────────────────────────────────────────
  getMedications: (includeInactive?: boolean) =>
    request<Medication[]>(`/health/medications${includeInactive ? "?includeInactive=true" : ""}`),
  createMedication: (data: {
    name: string;
    dosage?: string;
    frequency: string;
    timeOfDay?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  }) => request<Medication>("/health/medications", { method: "POST", body: JSON.stringify(data) }),
  updateMedication: (id: string, data: Partial<Pick<Medication, "name" | "dosage" | "frequency" | "timeOfDay" | "endDate" | "isActive" | "notes">>) =>
    request<Medication>(`/health/medications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMedication: (id: string) =>
    request<void>(`/health/medications/${id}`, { method: "DELETE" }),
  getMedicationLogs: (id: string, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<MedicationLog[]>(`/health/medications/${id}/logs${qs}`);
  },
  logMedication: (id: string, data?: { skipped?: boolean; takenAt?: string; notes?: string }) =>
    request<MedicationLog>(`/health/medications/${id}/log`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  // ─── Appointments ────────────────────────────────────────
  getAppointments: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<Appointment[]>(`/health/appointments${qs}`);
  },
  getAppointment: (id: string) => request<Appointment>(`/health/appointments/${id}`),
  createAppointment: (data: {
    title: string;
    doctorName?: string;
    specialty?: string;
    location?: string;
    scheduledAt: string;
    durationMinutes?: number;
    notes?: string;
  }) => request<Appointment>("/health/appointments", { method: "POST", body: JSON.stringify(data) }),
  updateAppointment: (id: string, data: Partial<Pick<Appointment, "title" | "doctorName" | "specialty" | "location" | "scheduledAt" | "durationMinutes" | "notes" | "status">>) =>
    request<Appointment>(`/health/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAppointment: (id: string) =>
    request<void>(`/health/appointments/${id}`, { method: "DELETE" }),

  // ─── Body Measurements ───────────────────────────────────
  getBodyMeasurements: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<BodyMeasurement[]>(`/health/body${qs}`);
  },
  logBodyMeasurement: (data: {
    measurementType: string;
    value: number;
    unit?: string;
    date?: string;
    notes?: string;
  }) => request<BodyMeasurement>("/health/body", { method: "POST", body: JSON.stringify(data) }),
  deleteBodyMeasurement: (id: string) =>
    request<void>(`/health/body/${id}`, { method: "DELETE" }),
};
