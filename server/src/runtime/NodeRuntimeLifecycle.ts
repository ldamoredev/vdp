import { RuntimeLifecycle, TerminationSignal } from './RuntimeLifecycle';

export class NodeRuntimeLifecycle implements RuntimeLifecycle {
    once(signal: TerminationSignal, handler: () => void): void {
        process.once(signal, handler);
    }

    exit(code: number): never {
        process.exit(code);
    }
}
