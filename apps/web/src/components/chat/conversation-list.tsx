import { formatDistanceToNow } from "date-fns";
import { History, Loader2, Plus } from "lucide-react";
import type { AgentConversation } from "@/lib/api/types";

interface ConversationListProps {
  conversations: AgentConversation[];
  conversationId: string | undefined;
  isLoadingHistory: boolean;
  historyError: string | null;
  onNewConversation: () => void;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  conversationId,
  isLoadingHistory,
  historyError,
  onNewConversation,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="border-b border-[var(--glass-border)] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--foreground)]">
          <History size={14} />
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
            Historial
          </span>
        </div>
        <button
          type="button"
          onClick={onNewConversation}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] bg-[var(--hover-overlay)] hover:bg-[var(--soft-overlay)] transition-all cursor-pointer"
        >
          <Plus size={12} />
          Nueva
        </button>
      </div>

      {historyError && (
        <p className="text-xs text-[var(--amber-soft-text)]">{historyError}</p>
      )}

      {isLoadingHistory && conversations.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <Loader2 size={12} className="animate-spin" />
          <span>Cargando conversaciones...</span>
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
          {conversations.map((conversation) => {
            const isActive = conversation.id === conversationId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => void onSelect(conversation.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--hover-overlay)]"
                    : "border-transparent bg-transparent hover:bg-[var(--hover-overlay)]"
                }`}
              >
                <div className="text-sm font-medium text-[var(--foreground)] truncate">
                  {conversation.title || "Conversacion sin titulo"}
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-1">
                  {formatDistanceToNow(new Date(conversation.updatedAt), {
                    addSuffix: true,
                  })}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Aun no hay conversaciones guardadas para este dominio.
        </p>
      )}
    </div>
  );
}
