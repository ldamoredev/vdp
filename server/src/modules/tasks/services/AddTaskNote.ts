import { TaskNoteRepository, TaskNote } from '../domain/TaskNoteRepository';

export class AddTaskNote {
    constructor(private noteRepository: TaskNoteRepository) {}

    async execute(taskId: string, content: string): Promise<TaskNote> {
        return this.noteRepository.addNote(taskId, content);
    }
}
