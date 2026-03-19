export abstract class TaskNoteRepository {
    abstract addNote(taskId: string, content: string): Promise<TaskNote>;
    abstract listNotes(taskId: string): Promise<TaskNote[]>;
    abstract deleteByTaskId(taskId: string): Promise<void>;
}

export type TaskNote = {
    id: string;
    taskId: string;
    content: string;
    createdAt: Date;
};
