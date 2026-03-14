import { FolderKanban, ListChecks, Clock, AlertTriangle, ArrowRight, Circle, CheckCircle2 } from "lucide-react";

const projects = [
  { name: "Rediseno App VDP", status: "En progreso", tasks: 24, completed: 18, color: "amber" },
  { name: "API Integraciones", status: "En progreso", tasks: 12, completed: 5, color: "blue" },
  { name: "Landing Page v2", status: "Revision", tasks: 8, completed: 7, color: "green" },
];

const tasks = [
  { title: "Implementar autenticacion OAuth", project: "API Integraciones", priority: "alta", status: "en_progreso" },
  { title: "Revisar PR de dark mode", project: "Rediseno App VDP", priority: "media", status: "pendiente" },
  { title: "Tests E2E modulo Wallet", project: "Rediseno App VDP", priority: "alta", status: "pendiente" },
  { title: "Actualizar documentacion API", project: "API Integraciones", priority: "baja", status: "en_progreso" },
  { title: "Deploy staging landing v2", project: "Landing Page v2", priority: "media", status: "completada" },
];

function getPriorityBadge(p: string) {
  if (p === "alta") return <span className="badge badge-red">Alta</span>;
  if (p === "media") return <span className="badge badge-blue">Media</span>;
  return <span className="badge badge-muted">Baja</span>;
}

function getStatusIcon(s: string) {
  if (s === "completada") return <CheckCircle2 size={16} className="text-emerald-400" />;
  if (s === "en_progreso") return <Circle size={16} className="text-amber-400" />;
  return <Circle size={16} className="text-[var(--muted)]" />;
}

export default function WorkDashboard() {
  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Tu semana de trabajo</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Proyectos activos", value: "3", icon: FolderKanban, color: "amber" },
          { label: "Tareas pendientes", value: "12", icon: ListChecks, color: "blue" },
          { label: "Horas esta semana", value: "32h", icon: Clock, color: "green" },
          { label: "Deadline proximo", value: "2 dias", icon: AlertTriangle, color: "red" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--foreground-muted)]">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stat.color === "amber" ? "bg-amber-500/15 text-amber-400" :
                stat.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                stat.color === "green" ? "bg-emerald-500/15 text-emerald-400" :
                "bg-red-500/15 text-red-400"
              }`}>
                <stat.icon size={15} />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div>
        <h3 className="font-medium mb-4">Proyectos activos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          {projects.map((p) => {
            const pct = Math.round((p.completed / p.tasks) * 100);
            return (
              <div key={p.name} className="glass-card p-5 cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    p.color === "amber" ? "bg-amber-500/15 text-amber-400" :
                    p.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                    "bg-emerald-500/15 text-emerald-400"
                  }`}>
                    <FolderKanban size={15} />
                  </div>
                  <span className="badge badge-muted">{p.status}</span>
                </div>
                <h4 className="font-medium text-sm mb-2">{p.name}</h4>
                <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
                  <span>{p.completed}/{p.tasks} tareas</span>
                  <span className="font-semibold text-[var(--foreground)]">{pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="glass-card-static overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border)]">
          <h3 className="font-medium">Tareas recientes</h3>
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] cursor-pointer">
            Ver todas <ArrowRight size={12} />
          </span>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {tasks.map((t) => (
            <div key={t.title} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                {getStatusIcon(t.status)}
                <div>
                  <div className={`text-sm font-medium ${t.status === "completada" ? "line-through text-[var(--muted)]" : ""}`}>{t.title}</div>
                  <div className="text-xs text-[var(--muted)]">{t.project}</div>
                </div>
              </div>
              {getPriorityBadge(t.priority)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
