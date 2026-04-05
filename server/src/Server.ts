import { App } from './App';

export class Server {
    private signalHandlersRegistered = false;

    constructor(
        private readonly app: App,
    ) {}

    async run(port: number, host: string): Promise<void> {
        this.registerSignalHandlers();

        try {
            await this.app.start(port, host);
        } catch (error) {
            await this.app.stop(error);
            this.exit(1);
        }
    }

    private registerSignalHandlers(): void {
        if (this.signalHandlersRegistered) {
            return;
        }

        const stop = () => {
            this.app.stop().finally(() => this.exit(0));
        };

        this.once('SIGINT', stop);
        this.once('SIGTERM', stop);
        this.signalHandlersRegistered = true;
    }

    private once(signal: 'SIGINT' | 'SIGTERM', handler: () => void): void {
        process.once(signal, handler);
    }

    private exit(code: number): never {
        process.exit(code);
    }
}

