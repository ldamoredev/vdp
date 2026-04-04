import { NotFoundHttpError } from '../../common/http/errors';
import { TaskNoteRepository, TaskNote, TaskNoteType } from '../domain/TaskNoteRepository';
import { TaskRepository } from '../domain/TaskRepository';
import { EmbedTask } from './EmbedTask';

export class AddTaskNote {
    constructor(
        private taskRepository: TaskRepository,
        private noteRepository: TaskNoteRepository,
        private embedTask: EmbedTask,
    ) {}

    async execute(userId: string, taskId: string, content: string, type: TaskNoteType = 'note'): Promise<TaskNote> {
        const task = await this.taskRepository.getTask(userId, taskId);
        if (!task) {
            throw new NotFoundHttpError('Task not found');
        }

        const note = await this.noteRepository.addNote(userId, taskId, content, type);
        this.embedTask.execute(userId, taskId).catch((err: unknown) => {
            console.warn('[EmbedTask] failed for task', taskId, err instanceof Error ? err.message : err);
        });
        return note;
    }
}
