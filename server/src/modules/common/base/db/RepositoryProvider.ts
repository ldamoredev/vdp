export abstract class RepositoryProvider {
    private cache = new Map<abstract new (...args: any[]) => any, any>();

    get<T>(token: abstract new (...args: any[]) => T): T {
        if (!this.cache.has(token)) {
            this.cache.set(token, this.create(token));
        }
        return this.cache.get(token) as T;
    }

    protected abstract create<T>(token: abstract new (...args: any[]) => T): T;
}

