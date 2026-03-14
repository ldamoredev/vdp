import { BookOpen, Flame, Clock, CheckCircle, Trophy, ArrowRight, Play } from "lucide-react";

const courses = [
  { name: "TypeScript Avanzado", platform: "Frontend Masters", progress: 72, hours: 12, totalHours: 18, color: "blue" },
  { name: "System Design", platform: "Educative.io", progress: 35, hours: 8, totalHours: 24, color: "purple" },
  { name: "Machine Learning Basico", platform: "Coursera", progress: 100, hours: 20, totalHours: 20, color: "emerald" },
];

const recentSessions = [
  { topic: "Generics avanzados en TS", course: "TypeScript Avanzado", duration: "1h 30m", date: "Hoy" },
  { topic: "Load Balancers", course: "System Design", duration: "45m", date: "Ayer" },
  { topic: "Decoradores y Metadata", course: "TypeScript Avanzado", duration: "2h", date: "12 Mar" },
  { topic: "Database Sharding", course: "System Design", duration: "1h 15m", date: "11 Mar" },
];

export default function StudyDashboard() {
  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Tu progreso de aprendizaje</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Cursos activos", value: "2", icon: BookOpen, color: "rose" },
          { label: "Racha de estudio", value: "14 dias", icon: Flame, color: "amber" },
          { label: "Horas esta semana", value: "8h", icon: Clock, color: "blue" },
          { label: "Temas completados", value: "23", icon: CheckCircle, color: "green" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--foreground-muted)]">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stat.color === "rose" ? "bg-rose-500/15 text-rose-400" :
                stat.color === "amber" ? "bg-amber-500/15 text-amber-400" :
                stat.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                "bg-emerald-500/15 text-emerald-400"
              }`}>
                <stat.icon size={15} />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Cursos en progreso</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          {courses.map((c) => {
            const isComplete = c.progress >= 100;
            return (
              <div key={c.name} className={`glass-card p-5 cursor-pointer ${isComplete ? "glow-green" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    c.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                    c.color === "purple" ? "bg-purple-500/15 text-purple-400" :
                    "bg-emerald-500/15 text-emerald-400"
                  }`}>
                    {isComplete ? <Trophy size={15} /> : <BookOpen size={15} />}
                  </div>
                  {isComplete ? (
                    <span className="badge badge-green">Completado</span>
                  ) : (
                    <button className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer">
                      <Play size={12} />
                    </button>
                  )}
                </div>
                <h4 className="font-medium text-sm mb-1">{c.name}</h4>
                <p className="text-xs text-[var(--muted)] mb-3">{c.platform}</p>
                <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
                  <span>{c.hours}h / {c.totalHours}h</span>
                  <span className="font-semibold text-[var(--foreground)]">{c.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-bar-fill ${isComplete ? "green" : ""}`} style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="glass-card-static overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border)]">
          <h3 className="font-medium">Sesiones recientes</h3>
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] cursor-pointer">
            Ver todas <ArrowRight size={12} />
          </span>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {recentSessions.map((s) => (
            <div key={s.topic} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <BookOpen size={16} className="text-rose-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">{s.topic}</div>
                  <div className="text-xs text-[var(--muted)]">{s.course}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium tabular-nums">{s.duration}</div>
                <div className="text-xs text-[var(--muted)]">{s.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
