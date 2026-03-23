export type TerminationSignal = 'SIGINT' | 'SIGTERM';

export interface RuntimeLifecycle {
    once(signal: TerminationSignal, handler: () => void): void;
    exit(code: number): never | void;
}
