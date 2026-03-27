"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Zap, X } from "lucide-react";
import { tasksApi } from "@/lib/api/tasks";
import { syncTaskQueryState } from "@/lib/tasks/chat-sync";
import { priorityLabel } from "@/lib/format";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(2);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: (task) => {
      syncTaskQueryState({
        tool: "create_task",
        parsedResult: task,
        queryClient,
      });
      setTitle("");
      setPriority(2);
      setOpen(false);
    },
  });

  const handleClose = useCallback(() => {
    setOpen(false);
    setTitle("");
    setPriority(2);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = title.trim();
      if (!trimmed) return;
      createMutation.mutate({ title: trimmed, priority });
    },
    [title, priority, createMutation],
  );

  // Global keyboard shortcut: Cmd+J (Mac) / Ctrl+J (other)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === "j") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to let the dialog render
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg mx-4 animate-fade-in-up"
        style={{
          background: "var(--card)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          backdropFilter: "blur(var(--blur-md))",
          WebkitBackdropFilter: "blur(var(--blur-md))",
        }}
      >
        <form onSubmit={handleSubmit} className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[var(--foreground)]">
              <Zap size={14} style={{ color: "var(--violet-soft-text)" }} />
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                Captura rapida
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
            >
              <X size={14} />
            </button>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Describir tarea concreta para hoy..."
            className="glass-input w-full px-4 py-3 text-sm"
            disabled={createMutation.isPending}
          />

          {/* Priority + Submit row */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-2xl border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                    priority === p
                      ? "translate-y-[-1px]"
                      : "border-transparent bg-[var(--hover-overlay)] text-[var(--muted)]"
                  }`}
                  style={
                    priority === p
                      ? {
                          background:
                            p === 3
                              ? "var(--red-soft-bg)"
                              : p === 2
                                ? "var(--amber-soft-bg)"
                                : "var(--muted-bg)",
                          color:
                            p === 3
                              ? "var(--red-soft-text)"
                              : p === 2
                                ? "var(--amber-soft-text)"
                                : "var(--foreground)",
                          borderColor:
                            p === 3
                              ? "var(--red-soft-border)"
                              : p === 2
                                ? "var(--amber-soft-border)"
                                : "var(--divider)",
                        }
                      : undefined
                  }
                >
                  {priorityLabel(p)}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className="btn-primary px-4 py-2 text-xs"
            >
              <Plus size={14} />
              {createMutation.isPending ? "Agregando..." : "Agregar"}
            </button>
          </div>

          {/* Footer hint */}
          <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--muted)]">
            <span>Enter para agregar &middot; Esc para cerrar</span>
            <kbd className="rounded border border-[var(--divider)] bg-[var(--hover-overlay)] px-1.5 py-0.5 font-mono text-[10px]">
              {typeof navigator !== "undefined" &&
              navigator.platform?.toUpperCase().includes("MAC")
                ? "\u2318"
                : "Ctrl"}
              +J
            </kbd>
          </div>
        </form>
      </div>
    </div>
  );
}
