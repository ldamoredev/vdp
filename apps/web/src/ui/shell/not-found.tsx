import { Link } from "react-router";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen animate-fade-in">
      <div className="glass-card-static p-8 max-w-md text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--hover-overlay)" }}
        >
          <Compass size={24} style={{ color: "var(--muted)" }} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Pagina no encontrada
        </h2>
        <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
          La ruta que buscas no existe o fue movida.
        </p>
        <Link to="/home" className="btn-primary mx-auto inline-flex">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
