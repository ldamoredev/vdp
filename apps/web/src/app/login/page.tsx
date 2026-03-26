"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      if (!res.ok) {
        setError("Clave incorrecta");
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Error de conexion");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-5 p-8 rounded-2xl"
        style={{
          background: "var(--glass)",
          border: "1px solid var(--glass-border)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="text-center">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            VDP
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--foreground-muted)" }}
          >
            Ingresa la clave de acceso
          </p>
        </div>

        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Clave de acceso"
          autoFocus
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--glass-border)",
            color: "var(--foreground)",
          }}
        />

        {error && (
          <p className="text-sm text-center" style={{ color: "var(--accent-red)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !secret}
          className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
