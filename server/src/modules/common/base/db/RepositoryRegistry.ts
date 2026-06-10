import { AbstractConstructor, RepositoryProvider } from './RepositoryProvider';

/**
 * RepositoryProvider backed by explicit per-module bindings, mirroring the
 * ServiceProvider pattern: each module registers its repository token ->
 * factory pairs, so common never imports domain concretes.
 */
export class RepositoryRegistry extends RepositoryProvider {
    private factories = new Map<AbstractConstructor, () => unknown>();

    register<T>(token: AbstractConstructor<T>, factory: () => T): void {
        this.factories.set(token, factory);
    }

    protected create<T>(token: AbstractConstructor<T>): T {
        const factory = this.factories.get(token);
        if (!factory) {
            throw new Error(`${token.name} not registered`);
        }
        return factory() as T;
    }
}
