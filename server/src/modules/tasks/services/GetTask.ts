import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { TaskNoteRepository, TaskNote } from '../domain/TaskNoteRepository';

export type TaskWithNotes = {
    task: Task;
    notes: TaskNote[];
};

export class GetTask {
    constructor(
        private repository: TaskRepository,
        private noteRepository: TaskNoteRepository,
    ) {}

    async execute(userId: string, id: string): Promise<Task | null> {
        return this.repository.getTask(userId, id);
    }

    async executeWithNotes(userId: string, id: string): Promise<TaskWithNotes | null> {
        const task = await this.repository.getTask(userId, id);
        if (!task) return null;

        const notes = await this.noteRepository.listNotes(userId, id);
        return { task, notes };
    }
}
