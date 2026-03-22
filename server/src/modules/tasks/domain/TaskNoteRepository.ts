export abstract class TaskNoteRepository {
    abstract addNote(taskId: string, content: string, type?: TaskNoteType): Promise<TaskNote>;
    abstract listNotes(taskId: string): Promise<TaskNote[]>;
    abstract deleteByTaskId(taskId: string): Promise<void>;
}

export type TaskNoteType = 'note' | 'breakdown_step' | 'blocker';

export type TaskNote = {
    id: string;
    taskId: string;
    content: string;
    type: TaskNoteType;
    createdAt: Date;
};
