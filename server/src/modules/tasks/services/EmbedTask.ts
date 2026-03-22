import { TaskRepository } from '../domain/TaskRepository';
import { TaskNoteRepository } from '../domain/TaskNoteRepository';
import { TaskEmbeddingRepository } from '../domain/TaskEmbeddingRepository';
import { EmbeddingProvider } from '../../common/base/embeddings/EmbeddingProvider';

export class EmbedTask {
    constructor(
        private taskRepository: TaskRepository,
        private noteRepository: TaskNoteRepository,
        private embeddingRepository: TaskEmbeddingRepository,
        private embeddingProvider: EmbeddingProvider,
    ) {}

    async execute(taskId: string): Promise<void> {
        const task = await this.taskRepository.getTask(taskId);
        if (!task) return;

        const notes = await this.noteRepository.listNotes(taskId);

        const parts = [task.title];
        if (task.description) parts.push(task.description);
        for (const note of notes) {
            parts.push(note.content);
        }

        const content = parts.join(' | ');
        const embedding = await this.embeddingProvider.embed(content);

        await this.embeddingRepository.upsert(taskId, content, embedding);
    }
}
