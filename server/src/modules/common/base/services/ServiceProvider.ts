// eslint-disable-next-line @typescript-eslint/no-explicit-any -- constructor spread requires `any`
export type SConstructor<T> = new (...args: any[]) => T;

export class ServiceProvider {
    private cache = new Map<SConstructor<unknown>, unknown>();
    private factories = new Map<SConstructor<unknown>, () => unknown>();

    register<T>(
        serviceType: SConstructor<T>,
        factory: () => T
    ): void {
        this.factories.set(serviceType as SConstructor<unknown>, factory);
    }

    get<T>(serviceType: SConstructor<T>): T {
        const key = serviceType as SConstructor<unknown>;

        if (!this.cache.has(key)) {
            const factory = this.factories.get(key);

            if (!factory) {
                throw new Error(
                    `Service ${serviceType.name} not registered`
                );
            }

            this.cache.set(key, factory());
        }

        return this.cache.get(key) as T;
    }
}
