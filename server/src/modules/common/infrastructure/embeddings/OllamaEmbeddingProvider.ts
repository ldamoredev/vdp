import { EmbeddingProvider } from '../../base/embeddings/EmbeddingProvider';

type OllamaEmbeddingResponse = {
    embedding?: number[];
};

export class OllamaEmbeddingProvider extends EmbeddingProvider {
    private readonly baseUrl: string;
    private readonly model: string;

    constructor(baseUrl?: string, model?: string) {
        super();
        this.baseUrl = baseUrl || 'http://localhost:11434';
        this.model = model || 'nomic-embed-text';
    }

    async embed(text: string): Promise<number[]> {
        const response = await fetch(`${this.baseUrl}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.model, prompt: text }),
        });

        if (!response.ok) {
            throw new Error(`Ollama embedding failed: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as OllamaEmbeddingResponse;

        if (!data.embedding) {
            throw new Error('Ollama returned no embedding');
        }

        return data.embedding;
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        const results: number[][] = [];
        for (const text of texts) {
            results.push(await this.embed(text));
        }
        return results;
    }
}
