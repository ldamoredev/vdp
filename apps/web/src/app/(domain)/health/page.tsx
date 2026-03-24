"use client";

import { useQuery } from "@tanstack/react-query";
import { healthApi } from "@/lib/api/health";
import { metricConfig } from "./components/config";
import { MetricCard } from "./components/metric-card";
import { WeeklyChart } from "./components/weekly-chart";
import { AppointmentsCard } from "./components/appointments-card";
import { MedicationsCard } from "./components/medications-card";
import { HabitsGrid } from "./components/habits-grid";

export default function HealthDashboard() {
  const { data: today } = useQuery({
    queryKey: ["health", "today"],
    queryFn: healthApi.getTodaySummary,
  });

  const { data: weeklyStats } = useQuery({
    queryKey: ["health", "weekly-stats"],
    queryFn: healthApi.getWeeklyStats,
  });

  const { data: appointments } = useQuery({
    queryKey: ["health", "appointments"],
    queryFn: () => healthApi.getAppointments("upcoming"),
  });

  const { data: medications } = useQuery({
    queryKey: ["health", "medications"],
    queryFn: () => healthApi.getMedications(),
  });

  const { data: habits } = useQuery({
    queryKey: ["health", "habits"],
    queryFn: () => healthApi.getHabits(),
  });

  const todayMetrics = today?.metrics || {};

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Tu salud de hoy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        {Object.keys(metricConfig).map((type) => (
          <MetricCard key={type} type={type} metric={todayMetrics[type]} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeeklyChart weeklyStats={weeklyStats} />

        <div className="space-y-6">
          <AppointmentsCard appointments={appointments} />
          <MedicationsCard medications={medications} />
        </div>
      </div>

      {habits && habits.length > 0 && <HabitsGrid habits={habits} />}
    </div>
  );
}
