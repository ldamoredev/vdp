import { Task } from '../domain/Task';
import { TaskRepository } from '../domain/TaskRepository';
import { TaskNoteRepository } from '../domain/TaskNoteRepository';

export class DeleteTask {
    constructor(
        private repository: TaskRepository,
        private noteRepository: TaskNoteRepository,
    ) {}

    async execute(userId: string, id: string): Promise<Task | null> {
        // Delete notes first (FK constraint)
        await this.noteRepository.deleteByTaskId(userId, id);
        return this.repository.deleteTask(userId, id);
    }
}
