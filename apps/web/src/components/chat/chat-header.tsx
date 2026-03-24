import { ArrowLeft, Sparkles, X } from "lucide-react";
import { chatStore } from "@/lib/chat-store";

interface ChatHeaderProps {
  label: string;
  isMobile: boolean;
}

export function ChatHeader({ label, isMobile }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={chatStore.close}
            className="p-2 -ml-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
          }}
        >
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <span className="font-medium text-sm text-[var(--foreground)]">
            Asistente {label}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-[10px] text-[var(--muted)]">En linea</span>
          </div>
        </div>
      </div>
      {!isMobile && (
        <button
          onClick={chatStore.close}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
