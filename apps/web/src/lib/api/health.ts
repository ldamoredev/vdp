import { request } from "./client";

export const healthApi = {
  // ─── Metrics ─────────────────────────────────────────────
  getMetrics: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<any[]>(`/health/metrics${qs}`);
  },
  logMetric: (data: {
    metricType: string;
    value: number;
    unit?: string;
    recordedAt?: string;
    notes?: string;
    source?: string;
  }) => request<any>("/health/metrics", { method: "POST", body: JSON.stringify(data) }),
  deleteMetric: (id: string) =>
    request<any>(`/health/metrics/${id}`, { method: "DELETE" }),
  getTodaySummary: () => request<any>("/health/today"),
  getWeeklyStats: () => request<any[]>("/health/stats/weekly"),

  // ─── Habits ──────────────────────────────────────────────
  getHabits: (includeInactive?: boolean) =>
    request<any[]>(`/health/habits${includeInactive ? "?includeInactive=true" : ""}`),
  createHabit: (data: {
    name: string;
    description?: string;
    frequency?: string;
    targetValue?: number;
    unit?: string;
    icon?: string;
    color?: string;
  }) => request<any>("/health/habits", { method: "POST", body: JSON.stringify(data) }),
  updateHabit: (id: string, data: any) =>
    request<any>(`/health/habits/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteHabit: (id: string) =>
    request<any>(`/health/habits/${id}`, { method: "DELETE" }),
  getHabitCompletions: (id: string, from?: string) => {
    const qs = from ? `?from=${from}` : "";
    return request<any[]>(`/health/habits/${id}/completions${qs}`);
  },
  completeHabit: (id: string, data?: { date?: string; value?: number; notes?: string }) =>
    request<any>(`/health/habits/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  // ─── Medications ─────────────────────────────────────────
  getMedications: (includeInactive?: boolean) =>
    request<any[]>(`/health/medications${includeInactive ? "?includeInactive=true" : ""}`),
  createMedication: (data: {
    name: string;
    dosage?: string;
    frequency: string;
    timeOfDay?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  }) => request<any>("/health/medications", { method: "POST", body: JSON.stringify(data) }),
  updateMedication: (id: string, data: any) =>
    request<any>(`/health/medications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMedication: (id: string) =>
    request<any>(`/health/medications/${id}`, { method: "DELETE" }),
  getMedicationLogs: (id: string, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<any[]>(`/health/medications/${id}/logs${qs}`);
  },
  logMedication: (id: string, data?: { skipped?: boolean; takenAt?: string; notes?: string }) =>
    request<any>(`/health/medications/${id}/log`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  // ─── Appointments ────────────────────────────────────────
  getAppointments: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<any[]>(`/health/appointments${qs}`);
  },
  getAppointment: (id: string) => request<any>(`/health/appointments/${id}`),
  createAppointment: (data: {
    title: string;
    doctorName?: string;
    specialty?: string;
    location?: string;
    scheduledAt: string;
    durationMinutes?: number;
    notes?: string;
  }) => request<any>("/health/appointments", { method: "POST", body: JSON.stringify(data) }),
  updateAppointment: (id: string, data: any) =>
    request<any>(`/health/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAppointment: (id: string) =>
    request<any>(`/health/appointments/${id}`, { method: "DELETE" }),

  // ─── Body Measurements ───────────────────────────────────
  getBodyMeasurements: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<any[]>(`/health/body${qs}`);
  },
  logBodyMeasurement: (data: {
    measurementType: string;
    value: number;
    unit?: string;
    date?: string;
    notes?: string;
  }) => request<any>("/health/body", { method: "POST", body: JSON.stringify(data) }),
  deleteBodyMeasurement: (id: string) =>
    request<any>(`/health/body/${id}`, { method: "DELETE" }),
};
