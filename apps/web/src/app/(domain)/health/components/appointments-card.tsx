import { CalendarClock } from "lucide-react";
import { formatRelative } from "@/lib/format";

interface AppointmentsCardProps {
  appointments: any[] | undefined;
}

export function AppointmentsCard({ appointments }: AppointmentsCardProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} style={{ color: "var(--blue-soft-text)" }} />
          <h3 className="font-medium text-sm">Proximas citas</h3>
        </div>
      </div>
      <div className="divide-y divide-[var(--glass-border)]">
        {appointments && appointments.length > 0 ? (
          appointments.slice(0, 3).map((a: any) => (
            <div key={a.id} className="p-3 hover:bg-[var(--hover-overlay)] transition-colors cursor-pointer">
              <div className="text-sm font-medium">{a.title}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[var(--muted)]">
                  {a.doctorName || a.specialty || ""}
                </span>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {formatRelative(a.scheduledAt)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-xs text-[var(--muted)] text-center">
            No hay citas programadas
          </div>
        )}
      </div>
    </div>
  );
}
