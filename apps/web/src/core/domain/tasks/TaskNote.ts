import type { TaskNote as TaskNoteDto } from "@vdp/shared";

/**
 * A task note. Plain data (reuses the wire shape). Type labels and tone classes
 * (note/breakdown_step/blocker) are presentation and live in the presenter.
 */
export type TaskNote = TaskNoteDto;
export type TaskNoteType = TaskNoteDto["type"];
