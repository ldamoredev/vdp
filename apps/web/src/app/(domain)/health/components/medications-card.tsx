import { Pill } from "lucide-react";

interface MedicationsCardProps {
  medications: any[] | undefined;
}

export function MedicationsCard({ medications }: MedicationsCardProps) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <Pill size={16} style={{ color: "var(--emerald-soft-text)" }} />
          <h3 className="font-medium text-sm">Medicamentos activos</h3>
        </div>
      </div>
      <div className="divide-y divide-[var(--glass-border)]">
        {medications && medications.length > 0 ? (
          medications.slice(0, 4).map((med: any) => (
            <div key={med.id} className="p-3 flex items-center justify-between hover:bg-[var(--hover-overlay)] transition-colors cursor-pointer">
              <div>
                <div className="text-sm font-medium">{med.name}</div>
                <div className="text-xs text-[var(--muted)]">
                  {med.dosage} - {med.timeOfDay || med.frequency}
                </div>
              </div>
              <div className="badge badge-green text-[10px]">{med.frequency}</div>
            </div>
          ))
        ) : (
          <div className="p-4 text-xs text-[var(--muted)] text-center">
            No hay medicamentos activos
          </div>
        )}
      </div>
    </div>
  );
}
