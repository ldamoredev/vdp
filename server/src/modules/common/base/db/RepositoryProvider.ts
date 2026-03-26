// eslint-disable-next-line @typescript-eslint/no-explicit-any -- abstract constructor spread requires `any`
type AbstractConstructor<T = unknown> = abstract new (...args: any[]) => T;

export abstract class RepositoryProvider {
    private cache = new Map<AbstractConstructor, unknown>();

    get<T>(token: AbstractConstructor<T>): T {
        if (!this.cache.has(token)) {
            this.cache.set(token, this.create(token));
        }
        return this.cache.get(token) as T;
    }

    protected abstract create<T>(token: AbstractConstructor<T>): T;
}

