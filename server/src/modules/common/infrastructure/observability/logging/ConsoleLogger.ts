import { Logger, LogMetadata } from '../../../base/observability/logging/Logger';

export class ConsoleLogger implements Logger {
    debug(message: string, metadata?: LogMetadata): void {
        this.write('debug', message, metadata);
    }

    info(message: string, metadata?: LogMetadata): void {
        this.write('info', message, metadata);
    }

    warn(message: string, metadata?: LogMetadata): void {
        this.write('warn', message, metadata);
    }

    error(message: string, metadata?: LogMetadata): void {
        this.write('error', message, metadata);
    }

    private write(
        level: 'debug' | 'info' | 'warn' | 'error',
        message: string,
        metadata?: LogMetadata,
    ): void {
        const output = metadata ? [message, metadata] : [message];
        console[level](...output);
    }
}
