"use client";

import { Footprints, Moon, Droplets, Flame, CalendarClock, Pill, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const weeklySteps = [
  { day: "Lun", steps: 7200 },
  { day: "Mar", steps: 9100 },
  { day: "Mie", steps: 6800 },
  { day: "Jue", steps: 11200 },
  { day: "Vie", steps: 8432 },
  { day: "Sab", steps: 5600 },
  { day: "Dom", steps: 3200 },
];

const appointments = [
  { doctor: "Dr. Gonzalez", specialty: "Clinico", date: "18 Mar", time: "10:30" },
  { doctor: "Dra. Mendez", specialty: "Dermatologa", date: "25 Mar", time: "15:00" },
  { doctor: "Dr. Alvarez", specialty: "Odontologo", date: "5 Abr", time: "09:00" },
];

const medications = [
  { name: "Vitamina D", dose: "1000 UI", time: "Manana", taken: true },
  { name: "Omega 3", dose: "1g", time: "Almuerzo", taken: true },
  { name: "Magnesio", dose: "400mg", time: "Noche", taken: false },
];

export default function HealthDashboard() {
  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Tu salud de hoy, viernes 14 de marzo</p>
      </div>

      {/* Today metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Pasos", value: "8,432", target: "/ 10,000", icon: Footprints, pct: 84, color: "emerald" },
          { label: "Sueno", value: "7h 23m", target: "/ 8h", icon: Moon, pct: 92, color: "blue" },
          { label: "Agua", value: "1.8 L", target: "/ 2.5 L", icon: Droplets, pct: 72, color: "cyan" },
          { label: "Calorias", value: "1,850", target: "/ 2,200", icon: Flame, pct: 84, color: "amber" },
        ].map((m) => (
          <div key={m.label} className="glass-card p-5 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--foreground-muted)]">{m.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                m.color === "emerald" ? "bg-emerald-500/15 text-emerald-400" :
                m.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                m.color === "cyan" ? "bg-cyan-500/15 text-cyan-400" :
                "bg-amber-500/15 text-amber-400"
              }`}>
                <m.icon size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight">{m.value}</span>
              <span className="text-xs text-[var(--muted)]">{m.target}</span>
            </div>
            <div className="progress-bar mt-3">
              <div className="progress-bar-fill green" style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly activity chart */}
        <div className="lg:col-span-2 glass-card-static p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Activity size={15} className="text-emerald-400" />
            </div>
            <h3 className="font-medium">Actividad semanal</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklySteps}>
              <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={{ stroke: "var(--glass-border)" }} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }} cursor={{ fill: "rgba(255, 255, 255, 0.02)" }} />
              <Bar dataKey="steps" fill="#10B981" name="Pasos" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Appointments */}
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-blue-400" />
                <h3 className="font-medium text-sm">Proximas citas</h3>
              </div>
            </div>
            <div className="divide-y divide-[var(--glass-border)]">
              {appointments.map((a) => (
                <div key={a.doctor} className="p-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div className="text-sm font-medium">{a.doctor}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[var(--muted)]">{a.specialty}</span>
                    <span className="text-xs text-[var(--foreground-muted)]">{a.date} - {a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="glass-card-static overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-2">
                <Pill size={16} className="text-emerald-400" />
                <h3 className="font-medium text-sm">Medicamentos hoy</h3>
              </div>
            </div>
            <div className="divide-y divide-[var(--glass-border)]">
              {medications.map((med) => (
                <div key={med.name} className="p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div>
                    <div className="text-sm font-medium">{med.name}</div>
                    <div className="text-xs text-[var(--muted)]">{med.dose} - {med.time}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${med.taken ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.04] text-[var(--muted)]"}`}>
                    {med.taken ? "✓" : "○"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
