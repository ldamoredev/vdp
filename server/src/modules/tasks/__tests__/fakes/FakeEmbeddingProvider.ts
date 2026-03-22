import { EmbeddingProvider } from '../../../common/base/embeddings/EmbeddingProvider';

export class FakeEmbeddingProvider extends EmbeddingProvider {
    private fixedVector: number[];
    public embedCalls: string[] = [];

    constructor(dimensions = 384) {
        super();
        this.fixedVector = new Array(dimensions).fill(0.1);
    }

    async embed(text: string): Promise<number[]> {
        this.embedCalls.push(text);
        return [...this.fixedVector];
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        return Promise.all(texts.map((t) => this.embed(t)));
    }

    clear(): void {
        this.embedCalls = [];
    }
}
