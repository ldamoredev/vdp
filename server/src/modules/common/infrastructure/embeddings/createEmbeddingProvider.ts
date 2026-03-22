import { EmbeddingProvider } from '../../base/embeddings/EmbeddingProvider';
import { NoOpEmbeddingProvider } from '../../base/embeddings/NoOpEmbeddingProvider';
import { OllamaEmbeddingProvider } from './OllamaEmbeddingProvider';

export function createEmbeddingProvider(env = process.env): EmbeddingProvider {
    const provider = env.EMBEDDING_PROVIDER;

    if (provider === 'ollama') {
        return new OllamaEmbeddingProvider(env.OLLAMA_BASE_URL, env.EMBEDDING_MODEL);
    }

    return new NoOpEmbeddingProvider();
}
