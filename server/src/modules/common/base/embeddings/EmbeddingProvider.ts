export abstract class EmbeddingProvider {
    abstract embed(text: string): Promise<number[]>;
    abstract embedBatch(texts: string[]): Promise<number[][]>;
}
