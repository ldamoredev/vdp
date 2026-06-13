"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DomainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error("[VDP Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="glass-card-static p-8 max-w-md text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--red-soft-bg)" }}
        >
          <AlertTriangle size={24} style={{ color: "var(--red-soft-text)" }} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Algo salio mal
        </h2>
        <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
          {error.message || "Ocurrio un error inesperado. Intenta de nuevo."}
        </p>
        <button
          onClick={reset}
          className="btn-primary mx-auto"
        >
          <RotateCcw size={14} />
          Reintentar
        </button>
      </div>
    </div>
  );
}
