import { Users, UserCheck, Heart, Briefcase, Phone, MessageSquare, Video, Calendar, Gift } from "lucide-react";

const contacts = [
  { name: "Martin Garcia", initials: "MG", role: "Amigo cercano", lastContact: "Hace 2 dias", type: "message", color: "purple" },
  { name: "Sofia Rodriguez", initials: "SR", role: "Familia", lastContact: "Hace 1 semana", type: "call", color: "green" },
  { name: "Lucas Fernandez", initials: "LF", role: "Trabajo", lastContact: "Hace 3 dias", type: "video", color: "blue" },
  { name: "Valentina Lopez", initials: "VL", role: "Amiga cercana", lastContact: "Hoy", type: "message", color: "pink" },
  { name: "Nicolas Martinez", initials: "NM", role: "Trabajo", lastContact: "Hace 5 dias", type: "call", color: "amber" },
];

const birthdays = [
  { name: "Ana Perez", date: "18 Mar", daysLeft: 4 },
  { name: "Diego Ruiz", date: "25 Mar", daysLeft: 11 },
  { name: "Camila Torres", date: "2 Abr", daysLeft: 19 },
];

function getContactIcon(type: string) {
  switch (type) {
    case "call": return <Phone size={14} />;
    case "video": return <Video size={14} />;
    default: return <MessageSquare size={14} />;
  }
}

export default function PeopleDashboard() {
  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-[var(--muted)] mt-1">Tu red de contactos y relaciones</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Total contactos", value: "147", icon: Users, color: "purple" },
          { label: "Amigos cercanos", value: "23", icon: UserCheck, color: "green" },
          { label: "Familia", value: "18", icon: Heart, color: "pink" },
          { label: "Trabajo", value: "52", icon: Briefcase, color: "blue" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--foreground-muted)]">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stat.color === "purple" ? "bg-purple-500/15 text-purple-400" :
                stat.color === "green" ? "bg-emerald-500/15 text-emerald-400" :
                stat.color === "pink" ? "bg-pink-500/15 text-pink-400" :
                "bg-blue-500/15 text-blue-400"
              }`}>
                <stat.icon size={15} />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent interactions */}
        <div className="lg:col-span-2 glass-card-static overflow-hidden">
          <div className="p-5 border-b border-[var(--glass-border)]">
            <h3 className="font-medium">Interacciones recientes</h3>
          </div>
          <div className="divide-y divide-[var(--glass-border)]">
            {contacts.map((c) => (
              <div key={c.name} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
                    c.color === "purple" ? "bg-purple-500/15 text-purple-400" :
                    c.color === "green" ? "bg-emerald-500/15 text-emerald-400" :
                    c.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                    c.color === "pink" ? "bg-pink-500/15 text-pink-400" :
                    "bg-amber-500/15 text-amber-400"
                  }`}>
                    {c.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-[var(--muted)]">{c.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)]">{c.lastContact}</span>
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[var(--muted)]">
                    {getContactIcon(c.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Birthdays */}
        <div className="glass-card-static overflow-hidden">
          <div className="p-5 border-b border-[var(--glass-border)]">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-pink-400" />
              <h3 className="font-medium">Cumpleanos proximos</h3>
            </div>
          </div>
          <div className="divide-y divide-[var(--glass-border)]">
            {birthdays.map((b) => (
              <div key={b.name} className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{b.name}</div>
                    <div className="text-xs text-[var(--muted)]">{b.date}</div>
                  </div>
                  <span className="badge badge-muted">
                    {b.daysLeft === 1 ? "Manana" : `En ${b.daysLeft} dias`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
