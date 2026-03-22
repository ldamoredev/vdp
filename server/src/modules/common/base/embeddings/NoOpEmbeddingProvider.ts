import { EmbeddingProvider } from './EmbeddingProvider';

const DIMENSIONS = 768;

export class NoOpEmbeddingProvider extends EmbeddingProvider {
    async embed(_text: string): Promise<number[]> {
        return new Array(DIMENSIONS).fill(0);
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        return texts.map(() => new Array(DIMENSIONS).fill(0));
    }
}
