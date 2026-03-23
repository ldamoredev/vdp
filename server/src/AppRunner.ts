import { App } from './App';
import { RuntimeLifecycle } from './runtime/RuntimeLifecycle';

export class AppRunner {
    private signalHandlersRegistered = false;

    constructor(
        private readonly app: App,
        private readonly runtime: RuntimeLifecycle,
    ) {}

    async run(port: number, host: string): Promise<void> {
        this.registerSignalHandlers();

        try {
            await this.app.start(port, host);
        } catch (error) {
            await this.app.stop(error);
            this.runtime.exit(1);
        }
    }

    registerSignalHandlers(): void {
        if (this.signalHandlersRegistered) {
            return;
        }

        const stop = () => {
            this.app.stop().finally(() => this.runtime.exit(0));
        };

        this.runtime.once('SIGINT', stop);
        this.runtime.once('SIGTERM', stop);
        this.signalHandlersRegistered = true;
    }
}
