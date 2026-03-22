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

    async execute(taskId: string, content: string, type: TaskNoteType = 'note'): Promise<TaskNote> {
        const task = await this.taskRepository.getTask(taskId);
        if (!task) {
            throw new NotFoundHttpError('Task not found');
        }

        const note = await this.noteRepository.addNote(taskId, content, type);
        this.embedTask.execute(taskId).catch(() => {});
        return note;
    }
}
