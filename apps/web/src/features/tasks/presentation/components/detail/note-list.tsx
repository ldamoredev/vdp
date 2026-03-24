import type { TaskNote } from "@/lib/api/types";
import { noteTypeLabel, noteTypeTone } from "../../tasks-dashboard-selectors";

interface NoteListProps {
  title: string;
  notes: TaskNote[];
  emptyMessage: string;
}

export function NoteList({ title, notes, emptyMessage }: NoteListProps) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {title}
      </div>
      {notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`rounded-2xl border px-3 py-3 text-sm ${noteTypeTone(note.type)}`}
            >
              <div className="mb-2 inline-flex rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
                {noteTypeLabel(note.type)}
              </div>
              <div>{note.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-6 text-center text-xs text-[var(--muted)]">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
