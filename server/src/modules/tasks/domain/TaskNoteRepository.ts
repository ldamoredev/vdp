export abstract class TaskNoteRepository {
    abstract addNote(userId: string, taskId: string, content: string, type?: TaskNoteType): Promise<TaskNote>;
    abstract listNotes(userId: string, taskId: string): Promise<TaskNote[]>;
    abstract deleteByTaskId(userId: string, taskId: string): Promise<void>;
}

export type TaskNoteType = 'note' | 'breakdown_step' | 'blocker';

export type TaskNote = {
    id: string;
    taskId: string;
    content: string;
    type: TaskNoteType;
    createdAt: Date;
};
